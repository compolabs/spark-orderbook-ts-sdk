import BN from "./utils/BN";
import { Fetch } from "./utils/Fetch";
import {
  GetOrdersParams,
  GetTradeOrderEventsParams,
  Order,
  TradeOrderEvent,
  Volume,
} from "./interface";

export class IndexerApi extends Fetch {
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
    const whereFilterParts: string[] = [];

    if (params.orderType) {
      whereFilterParts.push(`order_type: { _eq: "${params.orderType}" }`);
    }

    if (params.status?.length) {
      if (params.status.length > 1) {
        const statusConditions = params.status
          .map((status) => `{ status: { _eq: "${status}" } }`)
          .join(", ");
        whereFilterParts.push(`_or: [${statusConditions}]`);
      } else {
        whereFilterParts.push(`status: { _eq: "${params.status[0]}" }`);
      }
    }

    if (params.user) {
      whereFilterParts.push(`user: { _eq: "${params.user}" }`);
    }

    if (params.asset) {
      whereFilterParts.push(`asset: { _eq: "${params.asset}" }`);
    }

    const whereFilter = whereFilterParts.join(", ");

    const orderType = params.orderType === "Buy" ? "desc" : "asc";

    const query = `query OrderQuery {
      Order(limit: ${params.limit}, where: {${whereFilter}}, order_by: {price: ${orderType}}) {
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

    const response = await this.post<IndexerResponse<Order[], "Order">>({
      query,
    });

    return response.Order;
  };

  getTradeOrderEvents = async (
    params: GetTradeOrderEventsParams,
  ): Promise<TradeOrderEvent[]> => {
    const query = `query TradeOrderEventQuery {
      TradeOrderEvent(limit: ${params.limit}, order_by: { timestamp: desc }) {
        id
        trade_price
        trade_size
        timestamp
      }
    }`;

    const response = await this.post<
      IndexerResponse<TradeOrderEvent[], "TradeOrderEvent">
    >({
      query,
    });

    return response.TradeOrderEvent;
  };

  getVolume = async (): Promise<Volume> => {
    const now = new Date();
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() - dayMilliseconds);

    const yesterdayISO = yesterday.toISOString();

    const query = `query TradeOrderEventQuery {
      TradeOrderEvent(where: {timestamp: {_gte: "${yesterdayISO}"}}) {
        trade_size
        trade_price
      }
    }`;

    type TradeOrderEventPartial = Pick<
      TradeOrderEvent,
      "trade_size" | "trade_price"
    >;

    const response = await this.post<
      IndexerResponse<TradeOrderEventPartial[], "TradeOrderEvent">
    >({
      query,
    });

    if (!response.TradeOrderEvent.length) {
      return {
        volume24h: BN.ZERO.toString(),
        high24h: BN.ZERO.toString(),
        low24h: BN.ZERO.toString(),
      };
    }

    const data = response.TradeOrderEvent.reduce(
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

type IndexerResponse<T, K extends string> = Record<K, T>;
