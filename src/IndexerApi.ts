import { Fetch } from "./utils/Fetch";

export class IndexerApi extends Fetch {
  // SPOT

  getSpotMarketCreateEvents = async (): Promise<SpotMarketCreateEvent[]> => {
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

  getSpotOrders = async (params: SpotOrdersParams): Promise<SpotOrder[]> => {
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

  getSpotTradeEvents = async (
    params: BaseParams,
  ): Promise<SpotTradeEvent[]> => {
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

  getSpotVolume = async (): Promise<SpotVolume> => {
    return {
      volume24h: 0,
      high24h: 0,
      low24h: 0,
    };
    // return this.get<SpotVolume>("/spot/statistics");
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
  volume24h: number;
  high24h: number;
  low24h: number;
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
