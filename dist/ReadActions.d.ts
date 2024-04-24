import BN from "./utils/BN";
import { Asset, FetchOrdersParams, FetchTradesParams, MarketCreateEvent, Options, PerpAllTraderPosition, PerpMarket, PerpMaxAbsPositionSize, PerpPendingFundingPayment, PerpTraderOrder, SpotMarketVolume, SpotOrder, SpotOrderWithoutTimestamp, SpotTrades } from "./interface";
export declare class ReadActions {
    private indexerApi;
    constructor(url: string);
    fetchWalletBalance: (assetId: string, options: Options) => Promise<string>;
    fetchSpotMarkets: (limit: number) => Promise<MarketCreateEvent[]>;
    fetchSpotMarketPrice: (baseToken: string) => Promise<BN>;
    fetchSpotOrders: ({ baseToken, type, limit, trader, isActive, }: FetchOrdersParams) => Promise<SpotOrder[]>;
    fetchSpotTrades: ({ baseToken, limit, trader, }: FetchTradesParams) => Promise<SpotTrades[]>;
    fetchSpotVolume: () => Promise<SpotMarketVolume>;
    fetchSpotOrderById: (orderId: string) => Promise<SpotOrderWithoutTimestamp>;
    fetchPerpCollateralBalance: (accountAddress: string, assetAddress: string, options: Options) => Promise<BN>;
    fetchPerpAllTraderPositions: (accountAddress: string, options: Options) => Promise<PerpAllTraderPosition[]>;
    fetchPerpMarketPrice: (assetAddress: string, options: Options) => Promise<BN>;
    fetchPerpFundingRate: (assetAddress: string, options: Options) => Promise<BN>;
    fetchPerpFreeCollateral: (accountAddress: string, options: Options) => Promise<BN>;
    fetchPerpMarket: (baseAsset: Asset, quoteAsset: Asset, options: Options) => Promise<PerpMarket>;
    fetchPerpAllMarkets: (assets: Asset[], quoteAsset: Asset, options: Options) => Promise<PerpMarket[]>;
    fetchPerpPendingFundingPayment: (accountAddress: string, assetAddress: string, options: Options) => Promise<PerpPendingFundingPayment>;
    fetchPerpIsAllowedCollateral: (assetAddress: string, options: Options) => Promise<boolean>;
    fetchPerpTraderOrders: (accountAddress: string, assetAddress: string, options: Options) => Promise<PerpTraderOrder[]>;
    fetchPerpMaxAbsPositionSize: (accountAddress: string, assetAddress: string, tradePrice: string, options: Options) => Promise<PerpMaxAbsPositionSize>;
    fetchPerpMarkPrice: (assetAddress: string, options: Options) => Promise<BN>;
}
