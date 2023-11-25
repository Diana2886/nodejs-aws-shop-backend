import { Product } from "./product.interface";

export interface AvailableProduct extends Product {
    count: number;
}
