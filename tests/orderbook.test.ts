import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";
import { WalletUnlocked } from "fuels";

import SparkOrderbook from "../src";
import { IndexerApi } from "../src/IndexerApi";
import { ReadActions } from "../src/ReadActions";
import { NetworkError } from "../src/utils/NetworkError";
import { WriteActions } from "../src/WriteActions";

jest.mock("./ReadActions");
jest.mock("./WriteActions");
jest.mock("./IndexerApi");

describe("SparkOrderbook", () => {
  let sparkOrderbook: SparkOrderbook;
  let mockReadActions: jest.Mocked<ReadActions>;
  let mockWriteActions: jest.Mocked<WriteActions>;

  beforeEach(() => {
    // Setup mock implementations
    mockReadActions = new ReadActions() as jest.Mocked<ReadActions>;
    mockWriteActions = new WriteActions() as jest.Mocked<WriteActions>;

    sparkOrderbook = new SparkOrderbook({
      contractAddresses: {},
      wallet: {} as WalletUnlocked,
      networkUrl: "https://example.com",
    });
    // @ts-expect-error for accessing private properties in tests
    sparkOrderbook.read = mockReadActions;
    // @ts-expect-error for accessing private properties in tests
    sparkOrderbook.write = mockWriteActions;
  });

  test("should create an order", async () => {
    const orderParams = {
      /* order parameters */
    };
    const mockResponse = {
      /* Mock response */
    };

    mockWriteActions.createOrder.mockResolvedValue(mockResponse);

    const response = await sparkOrderbook.createOrder(orderParams);

    expect(mockWriteActions.createOrder).toHaveBeenCalledWith(
      orderParams,
      expect.any(Object),
    );
    expect(response).toEqual(mockResponse);
  });

  test("should throw an error if wallet is not set when getting API options", () => {
    sparkOrderbook.setActiveWallet(undefined);

    expect(() => sparkOrderbook.getApiOptions()).toThrow(NetworkError);
  });

  test("should fetch markets", async () => {
    const assetIdPairs = [["asset1", "asset2"]];
    const mockMarkets = {
      /* Market data */
    };

    mockReadActions.fetchMarkets.mockResolvedValue(mockMarkets);

    const markets = await sparkOrderbook.fetchMarkets(assetIdPairs);

    expect(mockReadActions.fetchMarkets).toHaveBeenCalledWith(
      assetIdPairs,
      expect.any(Object),
    );
    expect(markets).toEqual(mockMarkets);
  });

  test("should set active market and initialize indexer API", () => {
    const marketAddress = "market_address";
    // Mock implementation for IndexerApi
    const mockIndexerApi = new IndexerApi({
      /* GraphClientConfig */
    });
    // @ts-expect-error for accessing protected property in tests
    (mockIndexerApi.close as jest.Mock).mockImplementation();

    sparkOrderbook.setActiveMarket(marketAddress, {
      /* GraphClientConfig */
    });

    // Check if contract address is set properly
    expect(sparkOrderbook.options.contractAddresses.market).toBe(marketAddress);
  });

  // Add more tests as needed for the other methods

  afterEach(() => {
    jest.clearAllMocks();
  });
});
