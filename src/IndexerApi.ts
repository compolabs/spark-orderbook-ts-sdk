import { Fetch } from "./utils/Fetch";

export class IndexerApi extends Fetch {
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
    const response = await this.post<IndexerResponse<SpotMarketCreateEvent[]>>({
      query,
    });

    return response.SpotMarketCreateEvent;
  };

  getOrders = async (params: SpotOrdersParams): Promise<SpotOrder[]> => {
    let whereFilter = `base_size: {_neq: "0"}`;

    if (params.orderType) {
      whereFilter =
        `order_type: {_eq: "${params.orderType.toLowerCase()}"}, ` +
        whereFilter;
    }
    if (params.isOpened) {
      whereFilter = `base_price: {_neq: "0"},` + whereFilter;
    }
    if (params.trader) {
      whereFilter = `trader: {_eq: "${params.trader}"},` + whereFilter;
    }
    if (params.baseToken) {
      whereFilter = `base_token: {_eq: "${params.baseToken}"},` + whereFilter;
    }

    const orderType =
      params.orderType?.toLowerCase() === "buy" ? "desc" : "asc";

    const query = `query SpotOrderQuery {
      SpotOrder(limit: ${params.limit}, where: {${whereFilter}}, order_by: {base_price: ${orderType}}) {
        id,
        trader, 
        order_type,
        base_token,
        base_size,
        base_price,
        timestamp,
      }
    }
    `;

    const response = await this.post<IndexerResponse<SpotOrder[]>>({
      query,
    });

    return response.SpotOrder;
  };

  getTradeEvents = async (params: BaseParams): Promise<SpotTradeEvent[]> => {
    let whereFilter = "";

    if (params.trader) {
      whereFilter =
        `_or: [
        {seller: {_eq: "${params.trader}"}},
        {buyer: {_eq: "${params.trader}"}}
      ]` + whereFilter;
    }
    if (params.baseToken) {
      whereFilter = `base_token: {_eq: "${params.baseToken}"},` + whereFilter;
    }

    const query = `query SpotTradeEventQuery {
      SpotTradeEvent(limit: ${params.limit}, where: {${whereFilter}}, order_by: { timestamp: desc }) {
        base_token
        buyer
        seller
        id
        order_matcher
        timestamp
        sell_order_id
        buy_order_id
        trade_price
        trade_size
      }
    }`;

    const response = await this.post<IndexerResponse<SpotTradeEvent[]>>({
      query,
    });

    return response.SpotTradeEvent;
  };

  getVolume = async (): Promise<SpotVolume> => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const yesterdayISO = yesterday.toISOString();

    const query = `query SpotTradeEventQuery {
      SpotTradeEvent(where: {timestamp: {_gte: "${yesterdayISO}"}}) {
        trade_size
        trade_price
        timestamp
      }
    }`;

    const response = await this.post<IndexerResponse<SpotTradeEvent[]>>({
      query,
    });

    const data = response.SpotTradeEvent.reduce(
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

type BaseParams = {
  trader?: string;
  baseToken?: string;
  limit?: number;
};

interface SpotMarketCreateEvent {
  id: number;
  asset_id: string;
  asset_decimals: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

interface Order {
  id: string;
  trader: string;
  base_token: string;
  base_size: string;
  base_price: string;
  timestamp: string;
}

type SpotOrdersParams = BaseParams & {
  orderType?: "BUY" | "SELL";
  isOpened?: boolean;
};

type SpotVolume = {
  volume24h: string;
  high24h: string;
  low24h: string;
};

type SpotOrder = Order;

interface TradeEvent {
  base_token: string;
  seller: string;
  buyer: string;
  trade_size: string;
  trade_price: string;
  sell_order_id: string;
  buy_order_id: string;
  timestamp: string;
}

interface SpotTradeEvent extends TradeEvent {
  id: string;
  order_matcher: string;
}

interface IndexerResponse<T> {
  [key: string]: T;
}
