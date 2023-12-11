import * as apiGateway from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
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

const app = new cdk.App();

const stack = new cdk.Stack(app, "ImportServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION },
});

const bucket = s3.Bucket.fromBucketName(
  stack,
  "ImportBucket",
  "nodejs-aws-shop-import-service"
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
    allowOrigins: ["*"],
    allowMethods: [apiGateway.CorsHttpMethod.ANY],
    allowCredentials: false,
  },
});

api.addRoutes({
  integration: new HttpLambdaIntegration(
    "ImportProductsFileIntegration",
    importProductsFile
  ),
  path: "/import",
  methods: [apiGateway.HttpMethod.GET],
});
