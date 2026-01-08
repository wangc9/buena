import { FullPropertySchema } from "@cw/schema";
import { useRef, useState } from "react";
import { toast } from "sonner";
import z from "zod";

export function usePdfParser(
  onSuccess: (data: z.infer<typeof FullPropertySchema>) => void
) {
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  const parsePdf = async (file: File) => {
    setIsParsing(true);
    const toastId = toast.loading("Uploading document...");

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

        toast.loading("Analysing document... (This can take over a minute)", {
          id: toastId,
        });

        const startResult = await fetch(
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
        const { jobId }: { jobId: string } = await startResult.json();

        pollInterval.current = setInterval(async () => {
          try {
            const statusResult = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/ai/status/${jobId}`
            );
            const result = await statusResult.json();

            if (result.status == "completed") {
              clearInterval(pollInterval.current!);
              onSuccess(result.data);
              toast.success("Document analysed successfully.", {
                id: toastId,
              });
            } else if (result.status === "failed") {
              throw new Error(result.error);
            }
          } catch (error) {
            clearInterval(pollInterval.current!);
            toast.error("Document analysis failed.", {
              id: toastId,
            });
          }
        }, 3000);
        return {
          url: `${process.env.NEXT_PUBLIC_S3_URL}/${data.key}`,
          key: data.key,
        };
      }
    } catch (error) {
      console.log(error);
      toast.error("Upload failed.", {
        id: toastId,
      });
      if (pollInterval.current) clearInterval(pollInterval.current);
    } finally {
      setIsParsing(false);
    }
  };

  return { parsePdf, isParsing };
}
