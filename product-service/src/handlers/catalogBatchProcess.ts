import { PublishCommand } from "@aws-sdk/client-sns";
import { buildResponse } from "../utils";
import { createProduct } from "../db/products";
import { SNSClient } from "@aws-sdk/client-sns";

const snsClient = new SNSClient({ region: process.env.PRODUCT_AWS_REGION });

export const handler = async (event: any) => {
  try {
    console.log("sqs event", event);

    const records = event.Records;

    for (const record of records) {
      const newProductData = await createProduct(JSON.parse(record.body));

      await snsClient.send(
        new PublishCommand({
          Subject: "New Products Added to Catalog",
          Message: JSON.stringify(newProductData),
          TopicArn: process.env.CREATE_PRODUCT_TOPIC_ARN,
          MessageAttributes: {
            count: {
              DataType: "Number",
              StringValue: `${newProductData.count}`,
            },
          },
        })
      );
    }

    return buildResponse(200, records);
  } catch (err: any) {
    console.log("Error:", err);
    return buildResponse(500, err);
  }
};
