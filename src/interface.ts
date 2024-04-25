import { WalletLocked, WalletUnlocked } from "fuels";

import { MarketStatusOutput } from "./types/clearing-house/ClearingHouseAbi";
import BN from "./utils/BN";

export interface Contracts {
  spotMarket: string;
  tokenFactory: string;
  vault: string;
  accountBalance: string;
  clearingHouse: string;
  perpMarket: string;
  pyth: string;
  proxy: string;
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
  contractAddresses: Contracts;
  indexerApiUrl: string;
  wallet?: WalletLocked | WalletUnlocked;
  gasPrice?: string;
  gasLimitMultiplier?: string;
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
