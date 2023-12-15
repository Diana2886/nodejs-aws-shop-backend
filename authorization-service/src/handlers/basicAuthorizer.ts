export const handler = async (event: any /* , ctx: any, cb: any */) => {
  console.log("Event:", event /* , ctx, cb */);

  const authorizationHeader = event.headers?.authorization;
  console.log("authorizationHeader", authorizationHeader);

  if (!authorizationHeader) {
    // cb("Unauthorized");
    return {
      statusCode: 401,
      body: "Unauthorized",
    };
  }

  try {
    const encodedCredentials = authorizationHeader.split(" ")[1];
    const decodedCredentials = Buffer.from(
      encodedCredentials,
      "base64"
    ).toString("utf-8");
    const [username, password] = decodedCredentials.split(":");

    console.log(`username: ${username}, password: ${password}`);

    const storedUserPassword = process.env.Diana2886;
    const effect =
      !storedUserPassword || storedUserPassword !== password ? "Deny" : "Allow";

    const policy = generatePolicy(encodedCredentials, event.routeArn, effect);

    console.log("event.invokedFunctionArn", event.routeArn);
    console.log("policy", JSON.stringify(policy));

    // cb(null, policy);
    return {
      statusCode: 200,
      body: policy,
    };
  } catch (err: any) {
    // cb(`Unauthorized: ${err.message}`);
    return {
      statusCode: 403,
      body: `Unauthorized: ${err.message}`,
    };
  }
};

const generatePolicy = (
  principalId: string,
  resource: string,
  effect = "Allow"
) => {
  return {
    principalId: principalId,
    policyDocument: {
      Version: "2012-10-17",
      Statement: [
        {
          Action: "execute-api:Invoke",
          Effect: effect,
          // Resource: resource,
          Resource: 'arn:aws:execute-api:eu-west-1:771895814867:wo9elbcrc1/GET/import',
        },
      ],
    },
  };
};
