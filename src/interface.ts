import { WalletLocked, WalletUnlocked } from "fuels";

import BN from "./utils/BN";

export type MarketStatusOutput = "Opened" | "Paused" | "Closed";

export interface OrderbookContracts {
  market: string;
  orderbook: string;
  multiAsset: string;
}

export interface Asset {
  assetId: string;
  symbol: string;
  decimals: number;
}

interface BaseOptions {
  contractAddresses: OrderbookContracts;
  gasPrice: string;
  gasLimitMultiplier: string;
}

export interface Options extends BaseOptions {
  wallet: WalletLocked | WalletUnlocked;
}

export interface OptionsSpark extends BaseOptions {
  wallet?: WalletLocked | WalletUnlocked;
}

export interface GraphClientConfig {
  httpUrl: string;
  wsUrl: string;
}

export interface SparkParams {
  networkUrl: string;
  contractAddresses: Omit<OrderbookContracts, "market">;
  wallet?: WalletLocked | WalletUnlocked;
  gasPrice?: string;
  gasLimitMultiplier?: string;
}

export interface SpotOrderWithoutTimestamp {
  id: string;
  orderType: OrderType;
  trader: string;
  baseSize: BN;
  orderPrice: BN;
}

export interface UserMarketBalance {
  liquid: {
    base: string;
    quote: string;
  };
  locked: {
    base: string;
    quote: string;
  };
}

export type MarketCreateEvent = {
  id: string;
  assetId: string;
  decimal: number;
};

export type WriteTransactionResponse = {
  transactionId: string;
  value: unknown;
};

export interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

export enum OrderType {
  Buy = "Buy",
  Sell = "Sell",
}

export enum AssetType {
  Base = "Base",
  Quote = "Quote",
}

export enum LimitType {
  IOC = "IOC",
  FOK = "FOK",
  GTC = "GTC",
}

export type Status = "Active" | "Canceled" | "Closed";

export interface WithdrawAllType {
  amount: string;
  assetType: AssetType;
}

export interface SpotMarketCreateEvent {
  id: number;
  asset_id: string;
  asset_decimals: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrdersParams {
  limit: number;
  orderType?: OrderType;
  status?: Status[];
  user?: string;
  asset?: string;
}

export interface GetActiveOrdersParams {
  limit: number;
  orderType: OrderType;
  user?: string;
  asset?: string;
}

export type ActiveOrderReturn<T extends OrderType> = T extends OrderType.Buy
  ? { ActiveBuyOrder: Order[] }
  : { ActiveSellOrder: Order[] };

export interface CreateOrderParams {
  amount: string;
  price: string;
  type: OrderType;
  feeAssetId: string;
}

export interface FulfillOrderManyParams {
  amount: string;
  orderType: OrderType;
  limitType: LimitType;
  price: string;
  slippage: string;
  orders: string[];
  feeAssetId: string;
}

export interface Order {
  id: string;
  asset: string;
  amount: string;
  initial_amount: string;
  order_type: OrderType;
  price: string;
  status: Status;
  user: string;
  timestamp: string;
}

export interface GetTradeOrderEventsParams {
  limit: number;
}

export interface TradeOrderEvent {
  id: string;
  timestamp: string;
  trade_price: string;
  trade_size: string;
}

export type Volume = {
  volume24h: string;
  high24h: string;
  low24h: string;
};

export type Markets = Record<string, string>;

export interface MarketInfo {
  baseAssetId: string;
  baseAssetDecimals: number;
  quoteAssetId: string;
  quoteAssetDecimals: number;
  owner: string;
  priceDecimals: number;
  version: number;
}
