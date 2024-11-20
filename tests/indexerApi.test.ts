// IndexerApi.test.ts
import { ApolloQueryResult, FetchResult, Observable } from "@apollo/client";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  jest,
  test,
} from "@jest/globals";

import { IndexerApi } from "../src/IndexerApi";
import {
  ActiveOrderReturn,
  GetActiveOrdersParams,
  GetOrdersParams,
  GetTradeOrderEventsParams,
  Order,
  OrderType,
  TradeOrderEvent,
} from "../src/interface";
import {
  getActiveOrdersQuery,
  getOrdersQuery,
} from "../src/query/indexerQuery";

const USER_ADDRESS = "0x0000";
const ASSET_ADDRESS = "0x0001";
const MARKET_ADDRESS = "0x0002";
const MOCK_DATE = "2024-10-10T00:00:00Z";
const MOCK_DATE_YESTERDAY = "2024-10-09T00:00:00Z";

jest.mock("@apollo/client", () => {
  const actual = jest.requireActual("@apollo/client") as { gql: any };
  return {
    ...actual,
    ApolloClient: jest.fn().mockImplementation(() => ({
      query: jest.fn(),
      subscribe: jest.fn(),
    })),
    gql: actual.gql,
  };
});

describe("IndexerApi", () => {
  let indexerApi: IndexerApi;
  let mockQuery: jest.Mock<any>;
  let mockSubscribe: jest.Mock<any>;

  beforeEach(() => {
    indexerApi = new IndexerApi({
      httpUrl: "http://localhost",
      wsUrl: "ws://localhost",
    });
    mockQuery = indexerApi.client.query as jest.Mock<any>;
    mockSubscribe = indexerApi.client.subscribe as jest.Mock<any>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // Вспомогательные функции и константы
  const createMockOrder = (overrides?: Partial<Order>): Order => ({
    id: "1",
    asset: ASSET_ADDRESS,
    amount: "100",
    initialAmount: "100",
    orderType: OrderType.Buy,
    price: "50000",
    status: "Active",
    user: USER_ADDRESS,
    timestamp: MOCK_DATE,
    market: MARKET_ADDRESS,
    ...overrides,
  });

  const createMockOrders = (
    count: number,
    overrides?: Partial<Order>,
  ): Order[] => Array.from({ length: count }, () => createMockOrder(overrides));

  const createMockResponse = <T>(data: T): ApolloQueryResult<T> => ({
    data,
    loading: false,
    networkStatus: 7,
  });

  const createMockObservable = <T>(data: T): Observable<FetchResult<T>> =>
    new Observable<FetchResult<T>>((observer) => {
      observer.next({ data });
      observer.complete();
    });

  test("getOrders should construct the correct query and return formatted data", async () => {
    const params: GetOrdersParams = {
      limit: 10,
      market: [MARKET_ADDRESS],
      orderType: OrderType.Buy,
      status: ["Active"],
    };

    const mockData = { Order: createMockOrders(1) };
    const mockResponse = createMockResponse(mockData);

    mockQuery.mockResolvedValueOnce(mockResponse);

    const result = await indexerApi.getOrders(params);

    const expectedQueryOptions = getOrdersQuery("query", params);

    expect(result).toEqual(mockResponse);
    expect(mockQuery).toHaveBeenCalledWith(expectedQueryOptions);
  });

  test("getOrders should throw an error when client.query fails", async () => {
    const params: GetOrdersParams = {
      limit: 10,
      market: [MARKET_ADDRESS],
      orderType: OrderType.Buy,
    };

    const errorMessage = "Network error";

    mockQuery.mockRejectedValueOnce(new Error(errorMessage));

    await expect(indexerApi.getOrders(params)).rejects.toThrow(errorMessage);

    const expectedQueryOptions = getOrdersQuery("query", params);
    expect(mockQuery).toHaveBeenCalledWith(expectedQueryOptions);
  });

  test("subscribeOrders should subscribe with correct query and variables", (done) => {
    const params: GetOrdersParams = {
      limit: 10,
      market: [MARKET_ADDRESS],
      orderType: OrderType.Sell,
      status: ["Active"],
      user: USER_ADDRESS,
      asset: ASSET_ADDRESS,
      offset: 0,
    };

    const mockData = {
      Order: createMockOrders(1, { orderType: OrderType.Sell }),
    };
    const mockObservable = createMockObservable(mockData);

    mockSubscribe.mockReturnValueOnce(mockObservable);

    const result = indexerApi.subscribeOrders(params);

    const expectedQueryOptions = getOrdersQuery("subscription", params);

    expect(mockSubscribe).toHaveBeenCalledWith(expectedQueryOptions);
    expect(result).toBe(mockObservable);

    result.subscribe({
      next: (value) => {
        expect(value.data).toEqual(mockData);
      },
      error: (err) => {
        done(err);
      },
      complete: () => {
        done();
      },
    });
  });

  test("getActiveOrders should construct the correct query and return formatted data", async () => {
    const params: GetActiveOrdersParams = {
      limit: 5,
      market: [MARKET_ADDRESS],
      orderType: OrderType.Buy,
      user: USER_ADDRESS,
      asset: ASSET_ADDRESS,
      offset: 0,
    };

    const mockOrder = createMockOrder({
      id: "2",
      asset: ASSET_ADDRESS,
      amount: "50",
      initialAmount: "50",
      price: "4000",
      user: USER_ADDRESS,
      timestamp: MOCK_DATE,
    });

    const mockData: ActiveOrderReturn<OrderType.Buy> = {
      ActiveBuyOrder: [mockOrder],
    };

    const mockResponse = createMockResponse(mockData);

    mockQuery.mockResolvedValueOnce(mockResponse);

    const result = await indexerApi.getActiveOrders<OrderType.Buy>(params);

    const expectedQueryOptions = getActiveOrdersQuery("query", params);

    expect(result).toEqual(mockResponse);
    expect(mockQuery).toHaveBeenCalledWith(expectedQueryOptions);
  });

  test("subscribeActiveOrders should subscribe with correct query and variables", (done) => {
    const params: GetActiveOrdersParams = {
      limit: 5,
      market: [MARKET_ADDRESS],
      orderType: OrderType.Sell,
      user: USER_ADDRESS,
      asset: ASSET_ADDRESS,
      offset: 0,
    };

    const mockOrder = createMockOrder({
      orderType: OrderType.Sell,
      asset: ASSET_ADDRESS,
      amount: "100",
      initialAmount: "100",
      price: "2000",
      user: USER_ADDRESS,
      timestamp: MOCK_DATE,
    });

    const mockData: ActiveOrderReturn<OrderType.Sell> = {
      ActiveSellOrder: [mockOrder],
    };

    const mockObservable = createMockObservable(mockData);

    mockSubscribe.mockReturnValueOnce(mockObservable);

    const result = indexerApi.subscribeActiveOrders<OrderType.Sell>(params);

    const expectedQueryOptions = getActiveOrdersQuery("subscription", params);

    expect(mockSubscribe).toHaveBeenCalledWith(expectedQueryOptions);
    expect(result).toBe(mockObservable);

    result.subscribe({
      next: (value) => {
        expect(value.data).toEqual(mockData);
      },
      error: (err) => {
        done(err);
      },
      complete: () => {
        done();
      },
    });
  });

  test("getVolume should calculate volume, high, and low correctly", async () => {
    const params: GetTradeOrderEventsParams = {
      limit: 100,
      market: [MARKET_ADDRESS],
    };

    const mockDateNow = new Date(MOCK_DATE);
    const mockDateYesterday = new Date(MOCK_DATE_YESTERDAY);
    jest.useFakeTimers().setSystemTime(mockDateNow);

    const tradeEvents: TradeOrderEvent[] = [
      {
        id: "0",
        tradeSize: "100",
        tradePrice: "50000",
        timestamp: MOCK_DATE_YESTERDAY,
        sellerIsMaker: false,
      },
      {
        id: "1",
        tradeSize: "200",
        tradePrice: "51000",
        timestamp: MOCK_DATE_YESTERDAY,
        sellerIsMaker: false,
      },
      {
        id: "2",
        tradeSize: "150",
        tradePrice: "49500",
        timestamp: MOCK_DATE_YESTERDAY,
        sellerIsMaker: false,
      },
    ];

    const mockData = { TradeOrderEvent: tradeEvents };
    const mockResponse = createMockResponse(mockData);

    mockQuery.mockResolvedValueOnce(mockResponse);

    const result = await indexerApi.getVolume(params);

    expect(result).toEqual({
      volume24h: "450",
      high24h: "51000",
      low24h: "49500",
    });

    expect(mockQuery).toHaveBeenCalledWith({
      query: expect.any(Object),
      variables: {
        where: {
          market: { _eq: MARKET_ADDRESS },
          timestamp: { _gte: mockDateYesterday.toISOString() },
        },
      },
    });
    jest.useRealTimers();
  });

  test("getVolume should return zeros when no trade events are available", async () => {
    const params: GetTradeOrderEventsParams = {
      limit: 100,
      market: [MARKET_ADDRESS],
    };

    const mockData = { TradeOrderEvent: [] };
    const mockResponse = createMockResponse(mockData);

    mockQuery.mockResolvedValueOnce(mockResponse);

    const result = await indexerApi.getVolume(params);

    expect(result).toEqual({
      volume24h: "0",
      high24h: "0",
      low24h: "0",
    });
  });
});
