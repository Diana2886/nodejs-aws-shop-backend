import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import "dotenv/config";
import * as dynamodb from "aws-cdk-lib/aws-dynamodb";
import * as iam from "aws-cdk-lib/aws-iam";
import * as sqs from "aws-cdk-lib/aws-sqs";
import * as sns from "aws-cdk-lib/aws-sns";
import { SqsEventSource } from "aws-cdk-lib/aws-lambda-event-sources";

const app = new cdk.App();

const stack = new cdk.Stack(app, "ProductServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION },
});

const productsTable = dynamodb.Table.fromTableName(
  stack,
  "ProductsTable",
  `${process.env.PRODUCTS_TABLE_NAME}`
);
const stocksTable = dynamodb.Table.fromTableName(
  stack,
  "StocksTable",
  `${process.env.STOCKS_TABLE_NAME}`
);

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
    PRODUCTS_TABLE_NAME: productsTable.tableName,
    STOCKS_TABLE_NAME: stocksTable.tableName,
    DYNAMODB_TABLE_ARN_PRODUCTS: productsTable.tableArn,
    DYNAMODB_TABLE_ARN_STOCKS: stocksTable.tableArn,
    CREATE_PRODUCT_TOPIC_ARN: process.env.CREATE_PRODUCT_TOPIC_ARN!,
  },
};

const productsPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:Query"],
  resources: [
    `arn:aws:dynamodb:${process.env.PRODUCT_AWS_REGION}:${process.env.ACCOUNT_ID}:table/${process.env.PRODUCTS_TABLE_NAME}`,
  ],
});

const stocksPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:Query"],
  resources: [
    `arn:aws:dynamodb:${process.env.PRODUCT_AWS_REGION}:${process.env.ACCOUNT_ID}:table/${process.env.STOCKS_TABLE_NAME}`,
  ],
});

const getProductsList = new NodejsFunction(stack, "GetProductsListLambda", {
  ...sharedLambdaProps,
  functionName: "getProductsList",
  entry: "src/handlers/getProductsList.ts",
});

getProductsList.addToRolePolicy(productsPolicy);
getProductsList.addToRolePolicy(stocksPolicy);

const getProductsById = new NodejsFunction(stack, "GetProductsByIdLambda", {
  ...sharedLambdaProps,
  functionName: "getProductsById",
  entry: "src/handlers/getProductsById.ts",
});

getProductsById.addToRolePolicy(productsPolicy);
getProductsById.addToRolePolicy(stocksPolicy);

const createProduct = new NodejsFunction(stack, "CreateProductLambda", {
  ...sharedLambdaProps,
  functionName: "createProduct",
  entry: "src/handlers/createProduct.ts",
});

createProduct.addToRolePolicy(productsPolicy);
createProduct.addToRolePolicy(stocksPolicy);

const api = new apiGateway.HttpApi(stack, "ProductApi", {
  corsPreflight: {
    allowHeaders: ["*"],
    allowOrigins: ["*"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
    allowCredentials: false,
  },
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "GetProductsListIntegration",
    getProductsList
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.GET],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "GetProductByIdIntegration",
    getProductsById
  ),
  path: "/products/{productId}",
  methods: [apiGateway.HttpMethod.GET],
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "CreateProductIntegration",
    createProduct
  ),
  path: "/products",
  methods: [apiGateway.HttpMethod.POST],
});

const catalogItemsQueue = new sqs.Queue(stack, "CatalogItemsQueue", {
  queueName: "catalog-items-queue",
});

const catalogBatchProcess = new NodejsFunction(
  stack,
  "CatalogBatchProcessLambda",
  {
    ...sharedLambdaProps,
    functionName: "catalogBatchProcess",
    entry: "src/handlers/catalogBatchProcess.ts",
  }
);

catalogBatchProcess.addToRolePolicy(productsPolicy);
catalogBatchProcess.addToRolePolicy(stocksPolicy);

catalogBatchProcess.addEventSource(
  new SqsEventSource(catalogItemsQueue, { batchSize: 5 })
);

const createProductTopic = new sns.Topic(stack, "CreateProductTopic", {
  topicName: "create-product-topic",
});

new sns.Subscription(stack, "BigStockSubscription", {
  endpoint: process.env.BIG_STOCK_EMAIL!,
  protocol: sns.SubscriptionProtocol.EMAIL,
  topic: createProductTopic,
});

new sns.Subscription(stack, "RegularStockSubscription", {
  endpoint: process.env.REGULAR_STOCK_EMAIL!,
  protocol: sns.SubscriptionProtocol.EMAIL,
  topic: createProductTopic,
  filterPolicy: {
    count: sns.SubscriptionFilter.numericFilter({ lessThanOrEqualTo: 7 }),
  },
});

createProductTopic.grantPublish(catalogBatchProcess);
