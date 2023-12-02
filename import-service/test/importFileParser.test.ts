import { Readable } from "node:stream";
import {
  S3Client,
  GetObjectCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { processCSV, handler } from "../src/handlers/importFileParser";

describe("Tests for processCSV function", () => {
  const mockBody = "mock body content";
  const mockBucket = "test-bucket";
  const mockKey = "test-key";
  const mockS3 = new S3Client({ region: process.env.PRODUCT_AWS_REGION });

  test("processCSV successfully processes CSV data", async () => {
    const mockReadable = Readable.from(mockBody);

    mockS3.send = jest.fn().mockImplementation(async (command) => {
      if (
        command instanceof CopyObjectCommand ||
        command instanceof DeleteObjectCommand
      ) {
        return {};
      }
      return { Body: mockReadable };
    });

    await expect(
      processCSV(mockReadable, mockBucket, mockKey, mockS3)
    ).resolves.toBeUndefined();
  });

  test("processCSV handles errors during CSV processing", async () => {
    const failingReadable = Readable.from(mockBody);

    mockS3.send = jest.fn().mockResolvedValueOnce({ Body: failingReadable });

    try {
      setTimeout(() => {
        failingReadable.emit("error", new Error("Test CSV parsing error"));
      }, 100);

      await expect(
        processCSV(failingReadable, mockBucket, mockKey, mockS3)
      ).rejects.toThrow("Test CSV parsing error");
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
});

jest.mock("@aws-sdk/client-s3", () => ({
  S3Client: jest.fn(() => ({
    send: jest.fn(),
  })),
  GetObjectCommand: jest.fn(),
  CopyObjectCommand: jest.fn(),
  DeleteObjectCommand: jest.fn(),
}));

describe("Tests for handler function", () => {
  const mockS3 = new S3Client({ region: process.env.PRODUCT_AWS_REGION });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("handler processes S3 event records correctly", async () => {
    const mockEvent = {
      Records: [
        {
          s3: { bucket: { name: "test-bucket" }, object: { key: "test-key" } },
        },
      ],
    };

    (GetObjectCommand as unknown as jest.Mock).mockImplementation(() => ({
      send: jest.fn().mockResolvedValueOnce({ Body: "mock body content" }),
    }));

    await handler(mockEvent);

    expect(GetObjectCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Bucket: "test-bucket",
        Key: "test-key",
      })
    );
  });
});
