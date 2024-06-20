import { Fetch } from "./utils/Fetch";
import {
  GetMatchOrderEventsParams,
  GetOrdersParams,
  MatchOrderEvent,
  Order,
  SpotMarketCreateEvent,
  Volume,
} from "./interface";

export class IndexerApi extends Fetch {
  // TODO: NOT IMPLEMENTED FOR NEW VERSION
  getMarketCreateEvents = async (): Promise<SpotMarketCreateEvent[]> => {
    const query = `
      query SpotMarketCreateEventQuery {
        SpotMarketCreateEvent {
          id,
          asset_id,
          asset_decimals,
          timestamp,
        }
      }
    `;
    const response = await this.post<
      IndexerResponse<SpotMarketCreateEvent[], "SpotMarketCreateEvent">
    >({
      query,
    });

    return response.SpotMarketCreateEvent;
  };

  getOrders = async (params: GetOrdersParams): Promise<Order[]> => {
    const whereFilterParts: string[] = ['base_size: { _neq: "0" }'];

    if (params.orderType) {
      whereFilterParts.push(
        `order_type: { _eq: "${params.orderType.toLowerCase()}" }`,
      );
    }

    if (params.status) {
      whereFilterParts.push(`status: { _eq: "${params.status}" }`);
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
        initail_amount
        order_type
        price
        status
        user
      }
    }
    `;

    const response = await this.post<IndexerResponse<Order[], "Order">>({
      query,
    });

    return response.Order;
  };

  getMatchOrderEvents = async (
    params: GetMatchOrderEventsParams,
  ): Promise<MatchOrderEvent[]> => {
    const whereFilterParts: string[] = [];

    if (params.user) {
      whereFilterParts.push(`
        _or: [
          { owner: { _eq: "${params.user}" } },
          { counterparty: { _eq: "${params.user}" } }
        ]
      `);
    }

    if (params.asset) {
      whereFilterParts.push(`asset: { _eq: "${params.asset}" }`);
    }

    const whereFilter = whereFilterParts.join(", ");

    const query = `query MatchOrderEventQuery {
      MatchOrderEvent(limit: ${params.limit}, where: {${whereFilter}}, order_by: { timestamp: desc }) {
        id
        match_price
        match_size
        order_id
        order_matcher
        owner
        counterparty
        asset
        db_write_timestamp
      }
    }`;

    const response = await this.post<
      IndexerResponse<MatchOrderEvent[], "MatchOrderEvent">
    >({
      query,
    });

    return response.MatchOrderEvent;
  };

  getVolume = async (): Promise<Volume> => {
    const now = new Date();
    const dayMilliseconds = 24 * 60 * 60 * 1000;
    const yesterday = new Date(now.getTime() - dayMilliseconds);

    const yesterdayISO = yesterday.toISOString();

    const query = `query MatchOrderEventQuery {
      MatchOrderEvent(where: {db_write_timestamp: {_gte: "${yesterdayISO}"}}) {
        id
        match_price
        match_size
        db_write_timestamp
      }
    }`;

    type MatchOrderEventPartial = Pick<
      MatchOrderEvent,
      "id" | "match_price" | "match_size" | "db_write_timestamp"
    >;

    const response = await this.post<
      IndexerResponse<MatchOrderEventPartial[], "MatchOrderEvent">
    >({
      query,
    });

    const data = response.MatchOrderEvent.reduce(
      (prev, currentData) => {
        const price = BigInt(currentData.match_price);
        const size = BigInt(currentData.match_size);
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
