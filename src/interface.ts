import { B256Address, WalletLocked, WalletUnlocked } from "fuels";

import BN from "./utils/BN";

export type MarketStatusOutput = "Opened" | "Paused" | "Closed";

export interface OrderbookContracts {
  market: B256Address;
  tokenFactory: B256Address;
  pyth: B256Address;
}

export interface Asset {
  address: B256Address;
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
  indexerConfig: GraphClientConfig;
  contractAddresses?: OrderbookContracts;
  wallet?: WalletLocked | WalletUnlocked;
  gasPrice?: string;
  gasLimitMultiplier?: string;
  pythUrl?: string;
}

export interface SpotOrderWithoutTimestamp {
  id: string;
  assetType: AssetType;
  orderType: OrderType;
  trader: B256Address;
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
  assetId: B256Address;
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

export type Status = "Active" | "Canceled" | "Closed";

export interface SpotMarketCreateEvent {
  id: number;
  asset_id: B256Address;
  asset_decimals: string;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
}

export interface GetOrdersParams {
  limit: number;
  orderType?: OrderType;
  status?: Status[];
  user?: B256Address;
  asset?: B256Address;
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

export interface DepositParams {
  amount: string;
  asset: B256Address;
}

export interface CreateOrderParams {
  amount: string;
  tokenType: AssetType;
  price: string;
  type: OrderType;
}

export interface FulfillOrderManyParams {
  amount: string;
  assetType: AssetType;
  orderType: OrderType;
  price: string;
  slippage: string;
  orders: string[];
}

export interface WithdrawParams {
  amount: string;
  assetType: AssetType;
}

export interface Order {
  id: string;
  asset: B256Address;
  asset_type: AssetType;
  amount: string;
  initial_amount: string;
  order_type: OrderType;
  price: string;
  status: Status;
  user: B256Address;
  timestamp: string;
}

export interface GetTradeOrderEventsParams {
  limit: number;
}

export interface MatchOrderEvent {
  id: string;
  owner: B256Address;
  counterparty: B256Address;
  asset: B256Address;
  match_size: string;
  match_price: string;
  timestamp: string;
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
