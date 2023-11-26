import { buildResponse } from "../utils";
import { createProduct } from "../db/products";
import { v4 as uuidv4 } from "uuid";

export const handler = async (event: any) => {
  try {
    console.log("event from createProduct", event);

    const newProduct = {
      id: uuidv4(),
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
