import { buildResponse } from "../utils";
import { getProductsList } from "../db/products";
import { AvailableProduct } from "../types/availableProduct.interface";

export const handler = async (event: any) => {
  try {
    console.log("event from getProductsList", event);

    const products: AvailableProduct[] = await getProductsList();
    return buildResponse(200, products);
  } catch (err: any) {
    return buildResponse(500, {
      message: err.message,
    });
  }
};
