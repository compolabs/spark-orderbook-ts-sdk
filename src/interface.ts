import { WalletLocked, WalletUnlocked } from "fuels";

import BN from "./utils/BN";

export type MarketStatusOutput = "Opened" | "Paused" | "Closed";

export interface OrderbookContracts {
  market: string;
  tokenFactory: string;
  pyth: string;
}

export interface Asset {
  address: string;
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

export interface SparkParams {
  networkUrl: string;
  indexerApiUrl: string;
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
  trader: string;
  baseSize: BN;
  orderPrice: BN;
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
  orderType?: "Buy" | "Sell";
  status?: string;
  user?: string;
  asset?: string;
}

export interface Order {
  id: string;
  asset: string;
  asset_type: "Base" | "Quote";
  amount: string;
  initail_amount: string;
  order_type: "Buy" | "Sell";
  price: string;
  status: string;
  user: string;
  timestamp: string;
}

export interface GetMatchOrderEventsParams {
  limit: number;
  user?: string;
  asset?: string;
}

export interface MatchOrderEvent {
  id: string;
  match_price: string;
  match_size: string;
  order_id: string;
  order_matcher: string;
  owner: string;
  counterparty: string;
  asset: string;
  db_write_timestamp: string;
}

export type Volume = {
  volume24h: string;
  high24h: string;
  low24h: string;
};
