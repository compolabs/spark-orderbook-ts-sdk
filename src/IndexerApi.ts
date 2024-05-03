import { Fetch } from "./utils/Fetch";
import { MarketStatusOutput } from "./interface";

export class IndexerApi extends Fetch {
  // SPOT

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
    params: BaseParams,
  ): Promise<SpotTradeEvent[]> => {
    return this.get<SpotTradeEvent[]>("/spot/tradeEvents", params);
  };

  getSpotTradeEventsById = async (id: string): Promise<SpotTradeEvent> => {
    return this.get<SpotTradeEvent>(`/spot/tradeEvents/${id}`);
  };

  getSpotVolume = async (): Promise<SpotVolume> => {
    return this.get<SpotVolume>("/spot/statistics");
  };

  // PERP

  getPerpMarkets = async (): Promise<PerpMarketAPI[]> => {
    return this.get<PerpMarketAPI[]>("/perp/markets");
  };

  getPerpOrders = async (params: PerpOrdersParams): Promise<PerpOrder[]> => {
    return this.get<PerpOrder[]>("/perp/orders", params);
  };

  getPerpTradeEvents = async (
    params: BaseParams,
  ): Promise<PerpTradeEvent[]> => {
    return this.get<PerpTradeEvent[]>("/perp/orders", params);
  };

  getPerpPositions = async (params: BaseParams): Promise<PerpPosition[]> => {
    return this.get<PerpPosition[]>("/perp/orders", params);
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
  order_id: string;
  trader: string;
  base_token: string;
  base_size: string;
  base_price: string;
  timestamp: string;
}

interface SpotOrder extends Order {
  id: number;
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

type SpotOrdersParams = BaseParams & {
  orderType?: "BUY" | "SELL";
  isOpened?: boolean;
};

type SpotVolume = {
  volume24h: number;
  high24h: number;
  low24h: number;
};

type PerpMarketAPI = {
  asset_id: string;
  decimal: string;
  price_feed: string;
  im_ratio: string;
  mm_ratio: string;
  status: MarketStatusOutput;
  paused_index_price: string;
  paused_timestamp: string;
  closed_price: string;
};

type PerpOrdersParams = BaseParams & {
  isOpened?: string;
  orderType?: "buy" | "sell";
};

type PerpOrder = Order;

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
  id: number;
  order_matcher: string;
  createdAt: string;
  updatedAt: string;
}

type PerpTradeEvent = TradeEvent;

type PerpPosition = {
  trader: string;
  base_token: string;
  taker_position_size: string;
  taker_open_notional: string;
  last_tw_premium_growth_global: string;
};
