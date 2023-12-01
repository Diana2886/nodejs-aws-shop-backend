// import * as AWS from "aws-sdk";
import { S3Client, PutBucketCorsCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const handler = async (event: any) => {
  console.log("Event:", event);

  const s3 = new S3Client({ region: process.env.PRODUCT_AWS_REGION });
  const bucketName =
    process.env.BUCKET_NAME ?? "nodejs-aws-shop-import-service";
  const input = {
    Bucket: bucketName,
    CORSConfiguration: {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "PUT"],
          AllowedOrigins: ["*"],
        },
      ],
    },
  };
  const command = new PutBucketCorsCommand(input);
  const response = await s3.send(command);

  const { name } = event.queryStringParameters;

  const params = {
    Bucket: bucketName,
    Key: `uploaded/${name}`,
    ContentType: "text/csv",
  };

  let statusCode = 200;
  let body: Object | unknown = {};
  //   let productsFiles = [];
  //   const params = {
  //     Bucket: BUCKET,
  //     Prefix: "uploaded/",
  //   };

  try {
    const command = new PutObjectCommand(params);
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 60 });
    body = JSON.stringify(signedUrl);
    // const s3Response = await s3.listObjectsV2(params).promise();
    // productsFiles = s3Response.Contents!;
    // body = JSON.stringify(
    //   productsFiles
    //     .filter((productFile) => productFile.Size)
    //     .map(
    //       (productsFile) =>
    //         `https://${BUCKET}.s3.amazonaws.com/${productsFile.Key}`
    //     )
    // );
  } catch (error) {
    statusCode = 500;
    console.log("Error appears:", error);
    if (error instanceof Error) {
      body = JSON.stringify({ error: error.message });
    } else {
      body = JSON.stringify({ error: "An unknown error occurred" });
    }
  }

  return {
    statusCode,
    headers: { "Access-Control-Allow-Origin": "*" },
    body,
  };
};
