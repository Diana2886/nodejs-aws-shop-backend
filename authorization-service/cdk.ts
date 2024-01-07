import * as cdk from "aws-cdk-lib";
import * as lambda from "aws-cdk-lib/aws-lambda";
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs";
import * as iam from "aws-cdk-lib/aws-iam";
import "dotenv/config";

const app = new cdk.App();

const stack = new cdk.Stack(app, "AuthorizationServiceStack", {
  env: { region: process.env.PRODUCT_AWS_REGION },
});

const basicAuthorizer = new NodejsFunction(stack, "BasicAuthorizerLambda", {
  functionName: "basicAuthorizer",
  runtime: lambda.Runtime.NODEJS_18_X,
  entry: "src/handlers/basicAuthorizer.ts",
  environment: {
    Diana2886: process.env.Diana2886!,
  },
});

const principal = new iam.ServicePrincipal("apigateway.amazonaws.com");

basicAuthorizer.grantInvoke(principal);

basicAuthorizer.addPermission("apigateway.amazonaws.com Invocation", {
  principal: principal,
});
