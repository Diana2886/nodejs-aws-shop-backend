import {
  S3Client,
  PutBucketCorsCommand,
  PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { handler } from "../src/handlers/importProductsFile";

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  PutBucketCorsCommand: jest.fn(),
  PutObjectCommand: jest.fn(),
}));
jest.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: jest.fn(),
}));

describe("importProductsFile Lambda Function", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  const event = {
    queryStringParameters: {
      name: "test.csv",
    },
  };

  it("should handle S3 operations correctly", async () => {
    const response = await handler(event);
    expect(response.statusCode).toBe(200);
    expect(S3Client).toHaveBeenCalledWith({
      region: process.env.PRODUCT_AWS_REGION,
    });
    expect(PutBucketCorsCommand).toHaveBeenCalledWith({
      Bucket: "nodejs-aws-shop-import-service",
      CORSConfiguration: {
        CORSRules: [
          {
            AllowedHeaders: ["*"],
            AllowedMethods: ["GET", "PUT"],
            AllowedOrigins: ["*"],
          },
        ],
      },
    });

    (PutObjectCommand as unknown as jest.Mock).mockImplementation(() => ({
      promise: jest.fn().mockResolvedValueOnce({}),
    }));

    expect(PutObjectCommand).toHaveBeenCalledWith({
      Bucket: "nodejs-aws-shop-import-service",
      Key: "uploaded/test.csv",
      ContentType: "text/csv",
    });
  });

  it("should return a correct signed URL", async () => {
    (getSignedUrl as jest.Mock).mockResolvedValueOnce(
      "https://signed-url.example.com"
    );

    const response = await handler(event);

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual(
      JSON.stringify("https://signed-url.example.com")
    );
  });
});
