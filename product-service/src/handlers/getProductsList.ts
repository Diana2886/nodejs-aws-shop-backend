import { buildResponse } from "../utils";
import { PRODUCTS } from "../constants";

export const handler = async (event: any) => {
  try {
    console.log("event from getProductList", event);

    return buildResponse(200, PRODUCTS);
  } catch (err: any) {
    return buildResponse(500, {
      message: err.message,
    });
  }
};
