import { buildResponse } from "../utils";
import { getProductsList } from "../db/products";
import { Product } from "../types/product.interface";

export const handler = async (event: any) => {
  try {
    console.log("event from getProductsList", event);
    
    const products: Product[] = await getProductsList();
    console.log('PRODUCTS:', products)

    return buildResponse(200, products);
  } catch (err: any) {
    return buildResponse(500, {
      message: err.message,
    });
  }
};
