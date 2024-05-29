import { WalletLocked, WalletUnlocked } from "fuels";

import BN from "./utils/BN";

export type MarketStatusOutput = "Opened" | "Paused" | "Closed";

export interface Contracts {
  spotMarket: string;
  tokenFactory: string;
  vault: string;
  accountBalance: string;
  clearingHouse: string;
  perpMarket: string;
  pyth: string;
  proxy: string;
  insuranceFund?: string;
  lendMarket: string;
}

export interface Asset {
  address: string;
  symbol: string;
  decimals: number;
}

interface BaseOptions {
  contractAddresses: Contracts;
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
  contractAddresses?: Contracts;
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

export interface PerpTrades {
  baseToken: string;
  seller: string;
  buyer: string;
  tradeSize: string;
  tradePrice: string;
  sellOrderId: string;
  buyOrderId: string;
  timestamp: string;
}

export interface PerpAllTraderPosition {
  baseTokenAddress: string;
  lastTwPremiumGrowthGlobal: BN;
  takerOpenNational: BN;
  takerPositionSize: BN;
}

export interface PerpMarket {
  baseTokenAddress: string;
  quoteTokenAddress: string;
  imRatio: BN;
  mmRatio: BN;
  status: MarketStatusOutput;
  pausedIndexPrice?: BN;
  pausedTimestamp?: number;
  closedPrice?: BN;
}

export interface PerpTraderOrder {
  id: string;
  baseSize: BN;
  baseTokenAddress: string;
  orderPrice: BN;
  trader: string;
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

export type PerpMarketVolume = {
  predictedFundingRate: BN;
  averageFunding24h: BN;
  openInterest: BN;
  volume24h: BN;
};

export type PerpMaxAbsPositionSize = {
  shortSize: BN;
  longSize: BN;
};

export type PerpPendingFundingPayment = {
  fundingPayment: BN;
  fundingGrowthPayment: BN;
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
