import { handler } from "../src/handlers/getProductsById";
import { getProductById } from "../src/db/products";
import { buildResponse } from "../src/utils";

jest.mock("../src/db/products");
jest.mock("../src/utils");

describe("getProductsById handler", () => {
  const mockEvent = {
    pathParameters: {
      productId: "mockProductId",
    },
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get product by ID and return 200 response", async () => {
    const mockProduct = {
      id: "002b3c4d-1234-5678-abcd-1234567890ab",
      title: "Test3",
      description: "Description",
      price: 11,
      count: 7,
    };
    (getProductById as jest.Mock).mockResolvedValue(mockProduct);
    (buildResponse as jest.Mock).mockReturnValue(mockProduct);

    const result = await handler(mockEvent);

    expect(getProductById).toHaveBeenCalledWith("mockProductId");
    expect(buildResponse).toHaveBeenCalledWith(200, mockProduct);
    expect(result).toEqual(mockProduct);
  });

  it('should handle "Not found" error and return 404 response', async () => {
    const notFoundError = new Error("Not found");
    const expectedResponse = {
      statusCode: 404,
      body: { message: "Product not found" },
    };
    (getProductById as jest.Mock).mockRejectedValue(notFoundError);
    (buildResponse as jest.Mock).mockReturnValue(expectedResponse);

    const result = await handler(mockEvent);

    expect(getProductById).toHaveBeenCalledWith("mockProductId");
    expect(buildResponse).toHaveBeenCalledWith(404, {
      message: "Product not found",
    });
    expect(result).toEqual(expectedResponse);
  });

  it("should handle other errors and return 500 response", async () => {
    const errorMessage = "Internal server error";
    const otherError = new Error(errorMessage);

    const expectedResponse = {
      statusCode: 500,
      body: { message: errorMessage },
    };
    (getProductById as jest.Mock).mockRejectedValue(otherError);
    (buildResponse as jest.Mock).mockReturnValue(expectedResponse);

    const result = await handler(mockEvent);

    expect(getProductById).toHaveBeenCalledWith("mockProductId");
    expect(buildResponse).toHaveBeenCalledWith(500, { message: errorMessage });
    expect(result).toEqual(expectedResponse);
  });
});
