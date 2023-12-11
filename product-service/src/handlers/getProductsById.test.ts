import { handler } from "./getProductsById";

describe("getProductsById handler", () => {
  it("should return the correct product by ID", async () => {
    const mockEvent = {
      pathParameters: {
        productId: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae02",
      },
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(200);
    expect(response.body).toBeDefined();

    const responseBody = JSON.parse(response.body);

    expect(responseBody.product).toEqual(
      expect.objectContaining({
        id: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae02",
        title: "product2",
        description: "description for product2",
        price: 3000,
      })
    );
  });

  it("should return a 404 status code for a non-existent product ID", async () => {
    const mockEvent = {
      pathParameters: {
        productId: "6ec0bd7f-11c0-43da-975e-2a8ad9ebae99",
      },
    };

    const response = await handler(mockEvent);

    expect(response.statusCode).toBe(404);
    expect(response.body).toBeDefined();

    const responseBody = JSON.parse(response.body);

    expect(responseBody.message).toEqual("Product not found");
  });
});
