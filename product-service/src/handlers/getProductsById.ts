import { buildResponse } from "../utils";
import { getProductById } from "../db/products";

export const handler = async (event: any) => {
  try {
    console.log("event from getProductById", event);

    const product = await getProductById(event.pathParameters.productId)
    return buildResponse(200, product);
  } catch (err: any) {
    if (err.message === 'Not found') {
      return buildResponse(404, {
        message: "Product not found",
      });
    }
    return buildResponse(500, {
      message: err.message,
    });
  }
};
