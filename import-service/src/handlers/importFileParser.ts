import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";
import { Readable } from "node:stream";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const sqs = new SQSClient({ region: process.env.PRODUCT_AWS_REGION });

export const processCSV = async (
  Body: any,
  bucket: string,
  key: string,
  s3: S3Client
) => {
  return new Promise<void>((resolve, reject) => {
    const stream = Readable.from(Body)
      .pipe(csv())
      .on("data", async (data) => {
        try {
          const params = {
            QueueUrl:
              "https://sqs.eu-west-1.amazonaws.com/771895814867/catalog-items-queue",
            MessageBody: JSON.stringify(data),
          };
          await sqs.send(new SendMessageCommand(params));
        } catch (err) {
          console.error("Error sending message to SQS:", err);
        }
      })
      .on("error", (error) => {
        console.error("CSV parsing error:", error);
        reject(error);
      })
      .on("end", async () => {
        try {
          console.log("CSV parsing complete");

          const copyParams = {
            Bucket: bucket,
            CopySource: `${bucket}/${key}`,
            Key: key.replace("uploaded", "parsed"),
          };
          await s3.send(new CopyObjectCommand(copyParams));

          const deleteParams = {
            Bucket: bucket,
            Key: key,
          };
          await s3.send(new DeleteObjectCommand(deleteParams));

          resolve();
        } catch (err) {
          console.log("Error during file operation: ", err);
          reject(err);
        }
      });
  });
};

export const handler = async (event: any) => {
  console.log("Event:", event);

  const s3 = new S3Client({ region: process.env.PRODUCT_AWS_REGION });
  for (const record of event.Records) {
    const bucket = record.s3.bucket.name;
    const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, " "));

    try {
      const getParams = {
        Bucket: bucket,
        Key: key,
      };

      const { Body } = await s3.send(new GetObjectCommand(getParams));

      if (Body instanceof Readable) {
        await processCSV(Body, bucket, key, s3);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  }
};
