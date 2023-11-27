import {
  DynamoDBClient,
  ScanCommand,
  TransactWriteItemsCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { AvailableProduct, AvailableProductSchema } from "../models/Product";

const dynamodbClient = new DynamoDBClient({
  region: process.env.PRODUCT_AWS_REGION,
});

export const getProductsList = async () => {
  try {
    const productsParams = {
      TableName: "products",
    };
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

    return joinedData;
  } catch (err) {
    throw err;
  }
};

export const createProduct = async (newProduct: AvailableProduct) => {
  try {
    await AvailableProductSchema.validate(newProduct);

    const { id, title, description, price, count = 0 } = newProduct;

    if (typeof price !== 'number' || typeof count !== 'number') {
      const errors = [];
      if (typeof price !== 'number') {
        errors.push('Price must be a number');
      }
      if (typeof count !== 'number') {
        errors.push('Count must be a number');
      }
      
      throw {
        errorName: "ValidationError",
        errors: errors
      };
    }

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

    try {
      const command = new TransactWriteItemsCommand(params);
      await dynamodbClient.send(command);
      return { success: true };
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
