import { FullPropertySchema } from "@cw/schema";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

export function usePdfParser(
  onSuccess: (data: z.infer<typeof FullPropertySchema>) => void
) {
  const [isParsing, setIsParsing] = useState<boolean>(false);

  const parsePdf = async (file: File) => {
    setIsParsing(true);
    const toastId = toast.loading("Analysing document...");

    try {
      const presignedUrl = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/file`,
        {
          method: "POST",
          body: JSON.stringify({
            contentType: file.type,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      const data: { url: string; key: string } = await presignedUrl.json();

      if (data.url) {
        const s3UploadResult = await fetch(data.url, {
          method: "PUT",
          body: file,
          headers: {
            "Content-Type": file.type,
          },
        });
        if (!s3UploadResult.ok) throw new Error("S3 upload failed");

        const parseResult = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/ai/parse`,
          {
            method: "POST",
            body: JSON.stringify({
              fileKey: data.key,
            }),
            headers: {
              "Content-Type": "application/json",
            },
          }
        );
        if (!parseResult.ok) throw new Error("Parse failed");

        const parsedData = await parseResult.json();
        onSuccess(parsedData);
        toast.success("Document analysed successfully.", {
          id: toastId,
        });

        return {
          url: `${process.env.NEXT_PUBLIC_S3_URL}/${data.key}`,
          key: data.key,
        };
      }
    } catch (error) {
      console.log(error);
      toast.error("Document analysis failed.", {
        id: toastId,
      });
      return null;
    } finally {
      setIsParsing(false);
    }
  };

  return { parsePdf, isParsing };
}
