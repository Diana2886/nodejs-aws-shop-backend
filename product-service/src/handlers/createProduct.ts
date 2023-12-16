import { buildResponse } from "../utils";
import { createProduct } from "../db/products";
import { AvailableProduct } from "../types/availableProduct.interface";

export const handler = async (event: any) => {
  try {
    console.log("event from createProduct", event);

    const newProduct: AvailableProduct = {
      ...JSON.parse(event.body),
    };
    await createProduct(newProduct);
    return buildResponse(200, newProduct);
  } catch (err: any) {
    if (err.errorName === "ValidationError") {
      return buildResponse(400, err.error.errors);
    }
    return buildResponse(500, {
      message: err.message,
    });
  }
};
