import { handler } from "./getProductsList";

const PRODUCTS = [
  {
    id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae01",
    title: "product1",
    description: "description for product1",
    price: 1500,
  },
  {
    id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae02",
    title: "product2",
    description: "description for product2",
    price: 3000,
  },
  {
    id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae03",
    title: "product3",
    description: "description for product3",
    price: 800,
  },
  {
    id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae04",
    title: "product4",
    description: "description for product4",
    price: 1500,
  },
  {
    id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae05",
    title: "product5",
    description: "description for product5",
    price: 3000,
  },
  {
    id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae06",
    title: "product6",
    description: "description for product6",
    price: 800,
  },
];

describe("getProductsList handler", () => {
  it("should return a list of products", async () => {
    const mockEvent = {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Credentials": false,
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "*",
      },
      body: JSON.stringify(PRODUCTS),
    };
    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();

    const responseBody = JSON.parse(response.body);

    expect(responseBody).toEqual(PRODUCTS);
  });
});
