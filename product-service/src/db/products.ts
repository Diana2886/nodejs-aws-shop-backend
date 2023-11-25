import {
  DynamoDBClient,
  ScanCommand,
  TransactWriteItemsCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AvailableProduct, AvailableProductSchema } from "../models/Product";
import * as Yup from "yup";

const dynamodbClient = new DynamoDBClient({
  region: process.env.PRODUCT_AWS_REGION,
});
const docDynamodbClient = DynamoDBDocumentClient.from(dynamodbClient);

export const getProductsList = async () => {
  try {
    const productsParams = {
      TableName: "products",
    };

    console.log("productsParams", productsParams);

    const productsData = await dynamodbClient.send(
      new ScanCommand(productsParams)
    );

    const stocksParams = {
      TableName: "stocks",
    };

    const stocksData = await dynamodbClient.send(new ScanCommand(stocksParams));
    const stocksMap: { [key: string]: number } = {};

    if (stocksData.Items) {
      stocksData.Items.forEach((item: any) => {
        const productId = item.product_id.S;
        const count = parseInt(item.count.N);
        stocksMap[productId] = count;
      });
    }

    const joinedData =
      productsData.Items?.map((product: any) => {
        const productId = product.id.S;
        return {
          id: productId,
          title: product.title.S,
          description: product.description.S,
          price: parseInt(product.price.N),
          count: stocksMap[productId] || 0,
        };
      }) || [];

    console.log("joinedData", joinedData);

    return joinedData;
  } catch (err) {
    throw err;
  }
};

export const createProduct = async (newProduct: AvailableProduct) => {
  try {
    await AvailableProductSchema.validate(newProduct);
    // .then((validatedData) => console.log("Valid data:", validatedData))
    // .catch((validationError) => {
    //   console.error("Validation error:", validationError.errors);
    //   // throw new Error("Validation error");
    //   throw validationError;
    // });

    const { id, title, description, price, count = 0 } = newProduct;

    const productItem: Record<string, AttributeValue> = {
      id: { S: id },
      title: { S: title },
      description: { S: description },
      price: { N: price.toString() },
    };

    const stockItem: Record<string, AttributeValue> = {
      product_id: { S: id },
      count: { N: count.toString() },
    };

    const params = {
      TransactItems: [
        {
          Put: {
            TableName: "products",
            Item: productItem,
            ConditionExpression: "attribute_not_exists(id)",
          },
        },
        {
          Put: {
            TableName: "stocks",
            Item: stockItem,
            ConditionExpression: "attribute_not_exists(product_id)",
          },
        },
      ],
    };

    // const productsCommand = new PutCommand({
    //   TableName: "products",
    //   Item: {
    //     id,
    //     title,
    //     description,
    //     price,
    //   },
    // });

    // const stocksCommand = new PutCommand({
    //   TableName: "stocks",
    //   Item: {
    //     product_id: id,
    //     count,
    //   },
    // });

    try {
      const command = new TransactWriteItemsCommand(params);
      const transactionOutput = await dynamodbClient.send(command);
      console.log("Transaction successful: Product and Stock created.");
      return { success: true, transactionOutput };
      // const responseProduct = await docDynamodbClient.send(productsCommand);
      // const responseStocks = await docDynamodbClient.send(stocksCommand);
      // console.log('responseProduct', responseProduct);
      // console.log('responseStocks', responseStocks);
      // return {
      //   responseProduct,
      //   responseStocks,
      // };
    } catch (err) {
      throw err;
    }
  } catch (validationError) {
    console.error("Validation error:", validationError);
    throw {
      errorName: "ValidationError",
      error: validationError,
    };
  }
};
