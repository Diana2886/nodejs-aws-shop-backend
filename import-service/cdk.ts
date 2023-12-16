import * as apiGateway from "aws-cdk-lib/aws-apigatewayv2";
import { HttpLambdaIntegration } from "aws-cdk-lib/aws-apigatewayv2-integrations";
import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import {
  NodejsFunction,
  NodejsFunctionProps,
} from "aws-cdk-lib/aws-lambda-nodejs";
import "dotenv/config";
import * as iam from "aws-cdk-lib/aws-iam";
import * as s3 from "aws-cdk-lib/aws-s3";
import * as s3notifications from "aws-cdk-lib/aws-s3-notifications";
import * as sqs from "aws-cdk-lib/aws-sqs";
import {
  HttpLambdaAuthorizer,
  HttpLambdaResponseType,
} from "aws-cdk-lib/aws-apigatewayv2-authorizers";

const app = new cdk.App();

const stack = new cdk.Stack(app, "ImportServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION },
});

const bucket = s3.Bucket.fromBucketName(
  stack,
  "ImportBucket",
  "nodejs-aws-shop-import-service"
);

const queue = sqs.Queue.fromQueueArn(
  stack,
  "CatalogItemsQueue",
  process.env.CATALOG_ITEMS_QUEUE_ARN!
);

const sharedLambdaProps: Partial<NodejsFunctionProps> = {
  runtime: lambda.Runtime.NODEJS_18_X,
  environment: {
    PRODUCT_AWS_REGION: process.env.PRODUCT_AWS_REGION!,
  },
};

const importProductsFile = new NodejsFunction(
  stack,
  "ImportProductsFileLambda",
  {
    ...sharedLambdaProps,
    functionName: "importProductsFile",
    entry: "src/handlers/importProductsFile.ts",
  }
);
bucket.grantReadWrite(importProductsFile);

const importFileParser = new NodejsFunction(stack, "importFileParserLambda", {
  ...sharedLambdaProps,
  functionName: "importFileParser",
  entry: "src/handlers/importFileParser.ts",
});
bucket.grantRead(importFileParser);

const importPolicy = new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: ["s3:*"],
  resources: [
    "arn:aws:s3:::nodejs-aws-shop-import-service",
    "arn:aws:s3:::nodejs-aws-shop-import-service/*",
  ],
});

importProductsFile.addToRolePolicy(importPolicy);
importFileParser.addToRolePolicy(importPolicy);

queue.grantSendMessages(importFileParser);

bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3notifications.LambdaDestination(importFileParser),
  {
    prefix: "uploaded/",
  }
);

const api = new apiGateway.HttpApi(stack, "ImportApi", {
  corsPreflight: {
    allowHeaders: ["*"],
    allowOrigins: ["https://d2za0p8r8k37bf.cloudfront.net"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
    allowCredentials: true,
  },
});

const basicAuthorizer = lambda.Function.fromFunctionName(
  stack,
  "ImportBasicAuthorizerLambda",
  "basicAuthorizer"
);

const authorizer = new HttpLambdaAuthorizer(
  "BasicAuthorizer",
  basicAuthorizer,
  {
    responseTypes: [HttpLambdaResponseType.IAM],
  }
);

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "ImportProductsFileIntegration",
    importProductsFile
  ),
  path: "/import",
  methods: [apiGateway.HttpMethod.GET],
  authorizer,
});
