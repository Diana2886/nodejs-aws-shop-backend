import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import "dotenv/config";
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';

const app = new cdk.App();

const stack = new cdk.Stack(app, "ProductServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION },
});

const productsTable = dynamodb.Table.fromTableName(stack, 'ProductsTable', `${process.env.PRODUCTS_TABLE_NAME}`);
const stocksTable = dynamodb.Table.fromTableName(stack, 'StocksTable', `${process.env.STOCKS_TABLE_NAME}`);

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
    DYNAMODB_TABLE_NAME_PRODUCTS: productsTable.tableName,
    DYNAMODB_TABLE_NAME_STOCKS: stocksTable.tableName,
    DYNAMODB_TABLE_ARN_PRODUCTS: productsTable.tableArn,
    DYNAMODB_TABLE_ARN_STOCKS: stocksTable.tableArn,
  },
};

const productsScanPolicy  = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['dynamodb:Scan', 'dynamodb:PutItem'],
  resources: [`arn:aws:dynamodb:${process.env.PRODUCT_AWS_REGION}:${process.env.ACCOUNT_ID}:table/${process.env.PRODUCTS_TABLE_NAME}`],
});

const stocksScanPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ['dynamodb:Scan', 'dynamodb:PutItem'],
  resources: [`arn:aws:dynamodb:${process.env.PRODUCT_AWS_REGION}:${process.env.ACCOUNT_ID}:table/${process.env.STOCKS_TABLE_NAME}`],
});

const getProductsList = new NodejsFunction(stack, "GetProductsListLambda", {
  ...sharedLambdaProps,
  functionName: "getProductsList",
  entry: "src/handlers/getProductsList.ts",
});

getProductsList.addToRolePolicy(productsScanPolicy);
getProductsList.addToRolePolicy(stocksScanPolicy);

const getProductsById = new NodejsFunction(stack, "GetProductsByIdLambda", {
  ...sharedLambdaProps,
  functionName: "getProductsById",
  entry: "src/handlers/getProductsById.ts",
});

getProductsById.addToRolePolicy(productsScanPolicy);
getProductsById.addToRolePolicy(stocksScanPolicy);

const createProduct = new NodejsFunction(stack, "CreateProductLambda", {
  ...sharedLambdaProps,
  functionName: "createProduct",
  entry: "src/handlers/createProduct.ts",
});

createProduct.addToRolePolicy(productsScanPolicy);
createProduct.addToRolePolicy(stocksScanPolicy);

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
