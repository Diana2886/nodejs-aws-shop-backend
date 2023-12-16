export const handler = async (event: any, ctx: any, cb: any) => {
  console.log("Event:", event, ctx, cb);

  const authorizationHeader = event.headers?.authorization;
  console.log("authorizationHeader", authorizationHeader);

  if (!authorizationHeader) {
    cb("Unauthorized");
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

    const policy = generatePolicy(encodedCredentials, event.methodArn, effect);

    console.log("event.invokedFunctionArn", event.methodArn);
    console.log("policy", JSON.stringify(policy));

    cb(null, policy);
  } catch (err: any) {
    cb(`Unauthorized: ${err.message}`);
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
          Resource: resource,
        },
      ],
    },
  };
};
