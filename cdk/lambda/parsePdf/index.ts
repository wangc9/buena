import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import OpenAI from "openai";
import { z } from "zod";
import { zodTextFormat } from "openai/helpers/zod";
import path from "path";
import { pipeline } from "stream/promises";
import fs from "fs";

const s3 = new S3Client({ region: process.env.REGION });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const PropertySchema = z.object({
  buildings: z.array(
    z.object({
      tempId: z.string(),
      name: z.string().min(2),
      street: z.string().min(2),
      house: z.number().int().min(0),
      other: z.string().min(2),
    })
  ),
  units: z.array(
    z.object({
      buildingTempId: z.string(),
      type: z.enum(["Apartment", "Office", "Garden", "Parking"]),
      number: z.number().int().min(0),
      floor: z.number().int().min(-1),
      entrance: z.string().min(2),
      size: z.number().min(0),
      ownershipShare: z.string().min(2),
      year: z.number().int().min(0),
      rooms: z.number().int().min(0),
    })
  ),
});

export const handler = async (event: { fileKey: string; jobId: string }) => {
  const { fileKey, jobId } = event;
  const bucketName = process.env.BUCKET_NAME;
  const tempFilePath = path.join("/tmp", `downloaded-${Date.now()}.pdf`);
  let openaiFileId = null;
  const resultKey = `results/${jobId}.json`;

  try {
    const s3Response = await s3.send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: fileKey,
      })
    );

    if (!s3Response.Body) {
      throw new Error("S3 object body is empty");
    }
    await pipeline(
      s3Response.Body as ReadableStream,
      fs.createWriteStream(tempFilePath)
    );

    const fileUpload = await openai.files.create({
      file: fs.createReadStream(tempFilePath),
      purpose: "user_data",
    });
    openaiFileId = fileUpload.id;

    const modelResponse = await openai.responses.parse({
      model: "gpt-5-nano-2025-08-07",
      reasoning: {
        effort: "medium",
      },
      include: [
        "reasoning.encrypted_content",
        "web_search_call.action.sources",
      ],
      input: [
        {
          role: "system",
          content: `
          You are a real estate AI. Extract data from the German "Teilungserklärung".
          1. Buildings: Extract all buildings.
            - Assign a short unique 'tempId' (e.g. 'b1', 'b2') to each.
            - Map "Erdgeschoss" to 0.
            - Summarise the additional information into numbered points in English.
          2. Units: Extract all units.
            - Assign 'buildingTempId' matching the building's tempId.
            - Map "Wohnfläche" or "Nutzflache" to size and round to two decimal places.
            - Map "Geschoss" to floor.
            - Map "Tiefgarage" to floor -1.
          `,
        },
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: openaiFileId,
            },
          ],
        },
      ],
      text: {
        format: zodTextFormat(PropertySchema, "property"),
      },
    });

    const result = modelResponse.output_parsed;

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: resultKey,
        Body: JSON.stringify({ status: "completed", data: result }),
        ContentType: "application/json",
      })
    );

    return {
      statusCode: 200,
      body: "Job Started",
    };
  } catch (error: any) {
    console.error("Error:", error);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: resultKey,
        Body: JSON.stringify({
          status: "failed",
          error: error.message || String(error),
        }),
        ContentType: "application/json",
      })
    );

    return { statusCode: 500, error: error.message || String(error) };
  } finally {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    if (openaiFileId) {
      try {
        await openai.files.delete(openaiFileId);
        console.log("Deleted OpenAI File:", openaiFileId);
      } catch (e) {
        console.warn("Failed to delete OpenAI file:", e);
      }
    }
  }
};
