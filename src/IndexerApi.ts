import { gql } from "@apollo/client";

import BN from "./utils/BN";
import { GraphClient } from "./utils/GraphClient";
import {
  GetOrdersParams,
  GetTradeOrderEventsParams,
  Order,
  TradeOrderEvent,
  Volume,
} from "./interface";

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

  getOrders = async (params: GetOrdersParams): Promise<Order[]> => {
    const generateWhereFilter = (params: GetOrdersParams) => {
      const where: any = {};

      if (params.orderType) {
        where.order_type = { _eq: params.orderType };
      }

      if (params.status?.length) {
        if (params.status.length > 1) {
          where._or = params.status.map((status: string) => ({
            status: { _eq: status },
          }));
        } else {
          where.status = { _eq: params.status[0] };
        }
      }

      if (params.user) {
        where.user = { _eq: params.user };
      }

      if (params.asset) {
        where.asset = { _eq: params.asset };
      }

      return where;
    };

    const orderType = params.orderType === "Buy" ? "desc" : "asc";

    const query = gql`
      subscription OrderQuery(
        $limit: Int!
        $where: Order_bool_exp
        $orderType: order_by!
      ) {
        Order(limit: $limit, where: $where, order_by: { price: $orderType }) {
          id
          asset
          asset_type
          amount
          initial_amount
          order_type
          price
          status
          user
          timestamp
        }
      }
    `;

    const response = await this.client.query<{ Order: Order[] }>({
      query,
      variables: {
        limit: params.limit,
        where: generateWhereFilter(params),
        orderType,
      },
    });

    return response.data.Order;
  };

  getTradeOrderEvents = async (
    params: GetTradeOrderEventsParams,
  ): Promise<TradeOrderEvent[]> => {
    const query = gql`
      subscription TradeOrderEventQuery($limit: Int!, $orderBy: order_by!) {
        TradeOrderEvent(limit: $limit, order_by: { timestamp: $orderBy }) {
          id
          trade_price
          trade_size
          timestamp
        }
      }
    `;

    const response = await this.client.query<{
      TradeOrderEvent: TradeOrderEvent[];
    }>({
      query,
      variables: {
        ...params,
        orderBy: "desc",
      },
    });

    return response.data.TradeOrderEvent;
  };

  getVolume = async (): Promise<Volume> => {
    const now = new Date();
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() - dayMilliseconds);

    const yesterdayISO = yesterday.toISOString();

    const query = gql`
      subscription TradeOrderEventQuery($yesterdayISO: String!) {
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

    if (!response.data.TradeOrderEvent) {
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
