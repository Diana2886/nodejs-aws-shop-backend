import { handler } from '../src/handlers/catalogBatchProcess';
import { SNSClient, PublishCommand } from "@aws-sdk/client-sns";
import * as ProductsModule from "../src/db/products";

jest.mock('@aws-sdk/client-sns', () => ({
  SNSClient: jest.fn(() => ({
    send: jest.fn(),
  })),
  PublishCommand: jest.fn(),
}));

describe('Lambda handler function', () => {
  it('should process records and send messages to SNS', async () => {
    const mockEvent = {
      Records: [
        {
          body: JSON.stringify({
            id: '002b3c4d-1234-5678-abcd-1234567890ab',
            title: 'Test3',
            description: 'Description',
            price: '11',
            count: '7',
          }),
        },
      ],
    };

    const createProductMock = jest.spyOn(ProductsModule, 'createProduct');
    createProductMock.mockResolvedValue({
      id: '002b3c4d-1234-5678-abcd-1234567890ab',
      title: 'Test3',
      description: 'Description',
      price: 11,
      image: 'https://source.unsplash.com/300x400/?book',
      count: 7,
    });

    process.env.CREATE_PRODUCT_TOPIC_ARN = 'product-topic-arn';

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(createProductMock).toHaveBeenCalledTimes(mockEvent.Records.length);
    expect(SNSClient).toHaveBeenCalledTimes(1);
    expect(SNSClient).toHaveBeenCalledWith({ region: process.env.PRODUCT_AWS_REGION });
    expect(PublishCommand).toHaveBeenCalledTimes(mockEvent.Records.length);
    expect(PublishCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        Subject: "New Products Added to Catalog",
        Message: expect.any(String),
        TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
        MessageAttributes: {
          count: {
            DataType: "Number",
            StringValue: expect.any(String),
          },
        },
      })
    );

    jest.clearAllMocks();
  });
});
