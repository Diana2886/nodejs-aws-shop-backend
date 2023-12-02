import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import csv from "csv-parser";
// import { Readable } from "stream";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";

export const handler = async (event: any) => {
  console.log("Event:", event);

  const s3 = new S3Client({ region: process.env.PRODUCT_AWS_REGION });
  //   const bucket = "nodejs-aws-shop-import-service";
  const bucket = event.Records[0].s3.bucket.name;
  const key = decodeURIComponent(
    event.Records[0].s3.object.key.replace(/\+/g, " ")
  );
  console.log("bucket", bucket);
  console.log("key", key);

  try {
    const params = {
      Bucket: bucket,
      Key: key,
    };

    //   const s3Stream = await s3.getObject(params).createReadStream();
    const { Body } = await s3.send(new GetObjectCommand(params));
    console.log("Start of the stream");
    if (Body instanceof Readable) {
      const stream = Readable.from(Body)
        .pipe(csv())
        .on("data", (data) => {
          console.log("Parsed CSV record:", data);
        })
        .on("error", (error) => {
          console.error("CSV parsing error:", error);
        })
        .on("end", async () => {
          console.log("CSV parsing complete");
          const inputForCopy = {
            Bucket: bucket,
            CopySource: `${bucket}/${event.Records[0].s3.object.key}`,
            Key: event.Records[0].s3.object.key.replace("parsed", "uploaded"),
          };
          console.log("key", event.Records[0].s3.object.key);
          const copyCommand = new CopyObjectCommand(inputForCopy);
          const copyResponse = await s3.send(copyCommand);
          console.log("copyResponse", copyResponse);

          const inputForDelete = {
            Bucket: bucket,
            Key: event.Records[0].s3.object.key,
          };
          const deleteCommand = new DeleteObjectCommand(inputForDelete);
          const deleteResponse = await s3.send(deleteCommand);
          console.log("deleteResponse", deleteResponse);
          return {
            statusCode: 202,
          };
        });
    }
  } catch (error) {
    console.error("Error:", error);
  }
};
