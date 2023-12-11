import {
  DynamoDBClient,
  ScanCommand,
  TransactWriteItemsCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { QueryCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { AvailableProduct, AvailableProductSchema } from "../models/Product";
import { Stock } from "../types/stock.interface";
import { Product } from "../types/product.interface";
import { v4 as uuidv4 } from "uuid";

const dynamodbClient = new DynamoDBClient({
  region: process.env.PRODUCT_AWS_REGION,
});
const docDynamodbClient = DynamoDBDocumentClient.from(dynamodbClient);
const productsTableName = process.env.PRODUCTS_TABLE_NAME ?? "products";
const stocksTableName = process.env.STOCKS_TABLE_NAME ?? "stocks";

export const getProductsList = async () => {
  try {
    const productsParams = {
      TableName: productsTableName,
    };
    const productsData = await dynamodbClient.send(
      new ScanCommand(productsParams)
    );

    const stocksParams = {
      TableName: stocksTableName,
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

    return joinedData;
  } catch (err) {
    throw err;
  }
};

export const getProductById = async (id: string) => {
  try {
    const productsQueryOutput = await docDynamodbClient.send(
      new QueryCommand({
        TableName: productsTableName,
        KeyConditionExpression: "id = :id",
        ExpressionAttributeValues: {
          ":id": id,
        },
      })
    );
    const products = productsQueryOutput.Items as Product[];
    if (!products || !products.length) {
      throw new Error("Not found");
    }

    const product = products[0];
    const stocksQueryOutput = await docDynamodbClient.send(
      new QueryCommand({
        TableName: stocksTableName,
        KeyConditionExpression: "product_id = :product_id",
        ExpressionAttributeValues: { ":product_id": id },
      })
    );
    const stocks = stocksQueryOutput.Items as Stock[];
    const stock = stocks?.find((item) => item.product_id === id);

    const availableProduct: AvailableProduct = {
      ...product,
      count: stock?.count || 0,
    };
    return availableProduct;
  } catch (err) {
    throw err;
  }
};

export const createProduct = async (newProduct: AvailableProduct) => {
  try {
    await AvailableProductSchema.validate(newProduct);

    const { title, description } = newProduct;
    const price = Number(newProduct.price);
    const count = Number(newProduct.count) || 0;
    const id = newProduct.id || uuidv4();

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
            TableName: productsTableName,
            Item: productItem,
            ConditionExpression: "attribute_not_exists(id)",
          },
        },
        {
          Put: {
            TableName: stocksTableName,
            Item: stockItem,
            ConditionExpression: "attribute_not_exists(product_id)",
          },
        },
      ],
    };

    try {
      const command = new TransactWriteItemsCommand(params);
      await dynamodbClient.send(command);
      return {
        id,
        title,
        description,
        price,
        count,
      };
    } catch (err) {
      throw err;
    }
  } catch (validationError) {
    throw {
      errorName: "ValidationError",
      error: validationError,
    };
  }
};
