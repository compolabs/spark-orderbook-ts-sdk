import { Fetch } from "./utils/Fetch";
export declare class IndexerApi extends Fetch {
    getSpotMarketCreateEvents: () => Promise<SpotMarketCreateEvent[]>;
    getSpotMarketCreateEventsById: (id: string) => Promise<SpotMarketCreateEvent>;
    getSpotOrders: (params: SpotOrdersParams) => Promise<SpotOrder[]>;
    getSpotOrdersById: (id: string) => Promise<SpotOrder>;
    getSpotOrderChangeEvents: () => Promise<SpotOrderChangeEvent[]>;
    getSpotOrderChangeEventsById: (id: string) => Promise<SpotOrderChangeEvent>;
    getSpotTradeEvents: (params: SpotTradeEventsParams) => Promise<SpotTradeEvent[]>;
    getSpotTradeEventsById: (id: string) => Promise<SpotTradeEvent>;
    getSpotVolume: () => Promise<SpotVolume>;
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
export {};
