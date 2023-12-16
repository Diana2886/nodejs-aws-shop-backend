import { handler } from "../src/handlers/getProductsList";
import { getProductsList } from "../src/db/products";
import { buildResponse } from "../src/utils";

jest.mock("../src/db/products");
jest.mock("../src/utils");

describe("getProductsList handler", () => {
  const mockEvent = {};

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should get products list and return 200 response", async () => {
    const mockProducts = [
      {
        id: "mockId1",
        title: "Mock Product 1",
        description: "Mock Description 1",
        price: 10,
        count: 5,
      },
    ];

    (getProductsList as jest.Mock).mockResolvedValue(mockProducts);

    (buildResponse as jest.Mock).mockReturnValue({
      statusCode: 200,
      body: mockProducts,
    });

    const result = await handler(mockEvent);

    expect(getProductsList).toHaveBeenCalled();
    expect(buildResponse).toHaveBeenCalledWith(200, mockProducts);
    expect(result).toEqual({
      statusCode: 200,
      body: mockProducts,
    });
  });

  it("should handle error and return 500 response", async () => {
    const errorMessage = "Internal server error";
    const error = new Error(errorMessage);

    (getProductsList as jest.Mock).mockRejectedValue(error);

    (buildResponse as jest.Mock).mockReturnValue({
      statusCode: 500,
      body: { message: errorMessage },
    });

    const result = await handler(mockEvent);

    expect(getProductsList).toHaveBeenCalled();
    expect(buildResponse).toHaveBeenCalledWith(500, { message: errorMessage });
    expect(result).toEqual({
      statusCode: 500,
      body: { message: errorMessage },
    });
  });
});
