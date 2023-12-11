import { buildResponse } from "../utils";
import { PRODUCTS } from "../constants";

export const handler = async (event: any) => {
  try {
    console.log("event from getProductById", event);
    const product = PRODUCTS.find(
      (item) => item.id === event.pathParameters.productId
    );

    if (!product) {
      return buildResponse(404, {
        message: "Product not found",
      });
    }

    return buildResponse(200, {
      product,
    });
  } catch (err: any) {
    return buildResponse(500, {
      message: err.message,
    });
  }
};
