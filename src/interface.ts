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

export interface SpotOrder {
  id: string;
  baseToken: string;
  trader: string;
  baseSize: BN;
  orderPrice: BN;
  blockTimestamp: number;
}

export interface SpotOrderWithoutTimestamp {
  id: string;
  baseToken: string;
  trader: string;
  baseSize: BN;
  orderPrice: BN;
}

export interface SpotTrades {
  baseToken: string;
  buyer: string;
  id: string;
  matcher: string;
  seller: string;
  tradeAmount: BN;
  price: BN;
  timestamp: number;
}

export type FetchOrdersParams<T = string> = {
  baseToken: T;
  limit: number;
  trader?: T;
  type?: "BUY" | "SELL";
  isActive?: boolean;
};

export type FetchTradesParams<T = string> = {
  baseToken: T;
  limit: number;
  trader?: T;
};

export type MarketCreateEvent = {
  id: string;
  assetId: string;
  decimal: number;
};

export type SpotMarketVolume = {
  low: BN;
  high: BN;
  volume: BN;
};

export type WriteTransactionResponse = {
  transactionId: string;
  value: unknown;
};

export type UserSupplyBorrow = {
  supply: BN;
  borrow: BN;
};
export interface GraphQLResponse<T> {
  data: T;
  errors?: { message: string }[];
}

export enum OrderType {
  Buy = "Buy",
  Sell = "Sell",
}
