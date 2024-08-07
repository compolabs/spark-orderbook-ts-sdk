import {
  ApolloQueryResult,
  FetchResult,
  gql,
  Observable,
} from "@apollo/client";

import BN from "./utils/BN";
import { GraphClient } from "./utils/GraphClient";
import {
  ActiveOrderReturn,
  GetActiveOrdersParams,
  GetOrdersParams,
  GetTradeOrderEventsParams,
  Order,
  OrderType,
  TradeOrderEvent,
  Volume,
} from "./interface";
import { getActiveOrdersQuery, getOrdersQuery } from "./query";

export class IndexerApi extends GraphClient {
  // TODO: NOT IMPLEMENTED FOR NEW VERSION
  // getMarketCreateEvents = async (): Promise<SpotMarketCreateEvent[]> => {
  //   const query = `
  //     query SpotMarketCreateEventQuery {
  //       SpotMarketCreateEvent {
  //         id,
  //         asset_id,
  //         asset_decimals,
  //         timestamp,
  //       }
  //     }
  //   `;
  //   const response = await this.post<
  //     IndexerResponse<SpotMarketCreateEvent[], "SpotMarketCreateEvent">
  //   >({
  //     query,
  //   });

  //   // return response.SpotMarketCreateEvent;

  //   return [{
  //     id: 1,
  //     asset_id: '',
  //     asset_decimals: '',
  //     timestamp: '',
  //     createdAt: '',
  //     updatedAt: '',
  //   }]
  // };

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
    const query = gql`
      subscription ($limit: Int!, $orderBy: order_by!) {
        TradeOrderEvent(limit: $limit, order_by: { timestamp: $orderBy }) {
          id
          trade_price
          trade_size
          timestamp
        }
      }
    `;

    return this.client.subscribe<{
      TradeOrderEvent: TradeOrderEvent[];
    }>({
      query,
      variables: {
        ...params,
        orderBy: "desc",
      },
    });
  };

  getVolume = async (): Promise<Volume> => {
    const now = new Date();
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() - dayMilliseconds);

    const yesterdayISO = yesterday.toISOString();

    const query = gql`
      query TradeOrderEventQuery($yesterdayISO: String!) {
        TradeOrderEvent(where: { timestamp: { _gte: $yesterdayISO } }) {
          trade_size
          trade_price
        }
      }
    `;

    type TradeOrderEventPartial = Pick<
      TradeOrderEvent,
      "trade_size" | "trade_price"
    >;

    const response = await this.client.query<{
      TradeOrderEvent: TradeOrderEventPartial[];
    }>({
      query,
      variables: {
        yesterdayISO,
      },
    });

    if (!response) {
      return {
        volume24h: BN.ZERO.toString(),
        high24h: BN.ZERO.toString(),
        low24h: BN.ZERO.toString(),
      };
    }

    const data = response.data.TradeOrderEvent.reduce(
      (prev, currentData) => {
        const price = BigInt(currentData.trade_price);
        const size = BigInt(currentData.trade_size);
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
}
