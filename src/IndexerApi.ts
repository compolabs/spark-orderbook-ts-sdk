import {
  ApolloQueryResult,
  FetchResult,
  gql,
  Observable,
} from "@apollo/client";

import { getActiveOrdersQuery, getOrdersQuery } from "./query/indexerQuery";
import BN from "./utils/BN";
import { generateWhereFilter } from "./utils/generateWhereFilter";
import { GraphClient } from "./utils/GraphClient";
import {
  ActiveOrderReturn,
  GetActiveOrdersParams,
  GetOrdersParams,
  GetTradeOrderEventsParams,
  Order,
  OrderType,
  TradeOrderEvent,
  UserInfo,
  UserInfoParams,
  Volume,
} from "./interface";

export class IndexerApi extends GraphClient {
  getOrders = (
    params: GetOrdersParams,
  ): Promise<ApolloQueryResult<{ Order: Order[] }>> => {
    return this.client.query<{ Order: Order[] }>(
      getOrdersQuery("query", params),
    );
  };

  subscribeOrders = (
    params: GetOrdersParams,
  ): Observable<FetchResult<{ Order: Order[] }>> => {
    return this.client.subscribe<{ Order: Order[] }>(
      getOrdersQuery("subscription", params),
    );
  };

  getActiveOrders = <T extends OrderType>(
    params: GetActiveOrdersParams,
  ): Promise<ApolloQueryResult<ActiveOrderReturn<T>>> => {
    return this.client.query<ActiveOrderReturn<T>>(
      getActiveOrdersQuery("query", params),
    );
  };

  subscribeActiveOrders = <T extends OrderType>(
    params: GetActiveOrdersParams,
  ): Observable<FetchResult<ActiveOrderReturn<T>>> => {
    return this.client.subscribe<ActiveOrderReturn<T>>(
      getActiveOrdersQuery("subscription", params),
    );
  };

  subscribeTradeOrderEvents = (
    params: GetTradeOrderEventsParams,
  ): Observable<FetchResult<{ TradeOrderEvent: TradeOrderEvent[] }>> => {
    const { limit, ...restParams } = params;

    const query = gql`
      subscription (
        $limit: Int!
        $where: TradeOrderEvent_bool_exp
        $orderBy: order_by!
      ) {
        TradeOrderEvent(
          limit: $limit
          where: $where
          order_by: { timestamp: $orderBy }
        ) {
          id
          market
          tradeSize
          tradePrice
          buyer
          buyOrderId
          buyerBaseAmount
          buyerQuoteAmount
          seller
          sellOrderId
          sellerBaseAmount
          sellerQuoteAmount
          sellerIsMaker
          timestamp
        }
      }
    `;

    return this.client.subscribe<{
      TradeOrderEvent: TradeOrderEvent[];
    }>({
      query,
      variables: {
        limit,
        orderBy: "desc",
        where: generateWhereFilter(restParams),
      },
    });
  };

  getVolume = async (params: GetTradeOrderEventsParams): Promise<Volume> => {
    const { limit, ...restParams } = params;
    const now = new Date();
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() - dayMilliseconds);

    const timestamp = yesterday.toISOString();

    const query = gql`
      query TradeOrderEventQuery($where: TradeOrderEvent_bool_exp) {
        TradeOrderEvent(where: $where) {
          tradeSize
          tradePrice
        }
      }
    `;

    type TradeOrderEventPartial = Pick<
      TradeOrderEvent,
      "tradeSize" | "tradePrice"
    >;

    const response = await this.client.query<{
      TradeOrderEvent: TradeOrderEventPartial[];
    }>({
      query,
      variables: {
        where: {
          ...generateWhereFilter(restParams),
          timestamp: { _gte: timestamp },
        },
      },
    });

    if (!response.data.TradeOrderEvent.length) {
      return {
        volume24h: BN.ZERO.toString(),
        high24h: BN.ZERO.toString(),
        low24h: BN.ZERO.toString(),
      };
    }

    const data = response.data.TradeOrderEvent.reduce(
      (prev, currentData) => {
        const price = BigInt(currentData.tradePrice);
        const size = BigInt(currentData.tradeSize);
        prev.volume24h += size;

        if (prev.high24h < price) {
          prev.high24h = price;
        }

        if (prev.low24h > price) {
          prev.low24h = price;
        }

        return prev;
      },
      {
        volume24h: 0n,
        high24h: 0n,
        low24h: BigInt(Number.MAX_SAFE_INTEGER),
      },
    );

    return {
      volume24h: data.volume24h.toString(),
      high24h: data.high24h.toString(),
      low24h: data.low24h.toString(),
    };
  };

  subscribeUserInfo = (
    params: UserInfoParams,
  ): Observable<FetchResult<{ User: UserInfo[] }>> => {
    const query = gql`
      subscription UserQuery($where: User_bool_exp) {
        User(where: $where) {
          id
          active
          canceled
          closed
          timestamp
        }
      }
    `;

    return this.client.subscribe<{
      User: UserInfo[];
    }>({
      query,
      variables: {
        where: generateWhereFilter(params),
      },
    });
  };
}
