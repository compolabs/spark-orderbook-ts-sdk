import { Fetch } from "./utils/Fetch";

export class IndexerApi extends Fetch {
  getSpotMarketCreateEvents = async (): Promise<SpotMarketCreateEvent[]> => {
    return this.get<SpotMarketCreateEvent[]>("/spot/marketCreateEvents");
  };

  getSpotMarketCreateEventsById = async (
    id: string,
  ): Promise<SpotMarketCreateEvent> => {
    return this.get<SpotMarketCreateEvent>(`/spot/marketCreateEvents/${id}`);
  };

  getSpotOrders = async (params: SpotOrdersParams): Promise<SpotOrder[]> => {
    const paramsCopy = {
      ...params,
      orderType: params.orderType
        ? (params.orderType.toLowerCase() as string)
        : undefined,
      isOpened: params.isOpened
        ? (String(params.isOpened) as string)
        : undefined,
    };

    return this.get<SpotOrder[]>("/spot/orders", paramsCopy);
  };

  getSpotOrderChangeEvents = async (): Promise<SpotOrderChangeEvent[]> => {
    return this.get<SpotOrderChangeEvent[]>("/spot/orderChangeEvents");
  };

  getSpotOrderChangeEventsById = async (
    id: string,
  ): Promise<SpotOrderChangeEvent> => {
    return this.get<SpotOrderChangeEvent>(`/spot/ordersChangeEvents/${id}`);
  };

  getSpotTradeEvents = async (
    params: SpotTradeEventsParams,
  ): Promise<SpotTradeEvent[]> => {
    return this.get<SpotTradeEvent[]>("/spot/tradeEvents", params);
  };

  getSpotTradeEventsById = async (id: string): Promise<SpotTradeEvent> => {
    return this.get<SpotTradeEvent>(`/spot/tradeEvents/${id}`);
  };

  getSpotVolume = async (): Promise<SpotVolume> => {
    return this.get<SpotVolume>("/spot/statistics");
  };
}

interface SpotMarketCreateEvent {
  id: number;
  asset_id: string;
  asset_decimals: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

interface SpotOrder {
  id: number;
  order_id: string;
  trader: string;
  base_token: string;
  base_size: string;
  base_price: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

interface SpotOrderChangeEvent {
  id: number;
  order_id: string;
  trader: string;
  base_token: string;
  base_size_change: string;
  base_price: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

interface SpotTradeEvent {
  id: number;
  base_token: string;
  order_matcher: string;
  seller: string;
  buyer: string;
  trade_size: string;
  trade_price: string;
  sell_order_id: string;
  buy_order_id: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

type SpotOrdersParams = {
  trader?: string;
  baseToken?: string;
  orderType?: "BUY" | "SELL";
  isOpened?: boolean;
  limit?: number;
};

type SpotTradeEventsParams = {
  trader?: string;
  baseToken?: string;
  limit?: number;
};

type SpotVolume = {
  volume24h: number;
  high24h: number;
  low24h: number;
};
