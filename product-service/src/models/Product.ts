import * as Yup from "yup";

export const ProductSchema = Yup.object({
  id: Yup.string().required(),
  title: Yup.string().required().default(""),
  description: Yup.string().required().default(""),
  price: Yup.number().required().defined().positive(),
});

export const AvailableProductSchema = ProductSchema.shape({
  count: Yup.number().integer().required().defined().min(0).default(0),
});

export type Product = Yup.InferType<typeof ProductSchema>;
export type AvailableProduct = Yup.InferType<typeof AvailableProductSchema>;
