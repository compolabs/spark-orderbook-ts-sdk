import { Provider, WalletLocked, WalletUnlocked } from "fuels";
import BN from "./utils/BN";
import { Asset, FetchOrdersParams, FetchTradesParams, MarketCreateEvent, PerpAllTraderPosition, PerpMarket, PerpMaxAbsPositionSize, PerpPendingFundingPayment, SparkParams, SpotMarketVolume, SpotOrder, SpotTrades } from "./interface";
export declare class Spark {
    private write;
    private read;
    private providerPromise;
    private options;
    constructor(params: SparkParams);
    setActiveWallet: (wallet?: WalletLocked | WalletUnlocked) => void;
    createSpotOrder: (baseToken: Asset, quoteToken: Asset, size: string, price: string) => Promise<string>;
    cancelSpotOrder: (orderId: string) => Promise<string>;
    matchSpotOrders: (sellOrderId: string, buyOrderId: string) => Promise<string>;
    mintToken: (token: Asset, amount: string) => Promise<string>;
    depositPerpCollateral: (asset: Asset, amount: string) => Promise<string>;
    withdrawPerpCollateral: (baseToken: Asset, gasToken: Asset, amount: string, oracleUpdateData: string[]) => Promise<string>;
    openPerpOrder: (baseToken: Asset, gasToken: Asset, amount: string, price: string, updateData: string[]) => Promise<string>;
    removePerpOrder: (assetId: string) => Promise<string>;
    fulfillPerpOrder: (gasToken: Asset, orderId: string, amount: string, updateData: string[]) => Promise<string>;
    fetchSpotMarkets: (limit: number) => Promise<MarketCreateEvent[]>;
    fetchSpotMarketPrice: (baseToken: Asset) => Promise<BN>;
    fetchSpotOrders: (params: FetchOrdersParams) => Promise<SpotOrder[]>;
    fetchSpotTrades: (params: FetchTradesParams) => Promise<SpotTrades[]>;
    fetchSpotVolume: () => Promise<SpotMarketVolume>;
    fetchSpotOrderById: (orderId: string) => Promise<SpotOrder>;
    fetchPerpCollateralBalance: (accountAddress: string, asset: Asset) => Promise<BN>;
    fetchPerpAllTraderPositions: (accountAddress: string) => Promise<PerpAllTraderPosition[]>;
    fetchPerpIsAllowedCollateral: (asset: Asset) => Promise<boolean>;
    fetchPerpTraderOrders: (accountAddress: string, asset: Asset) => Promise<import("./interface").PerpTraderOrder[]>;
    fetchPerpAllMarkets: (assetList: Asset[], quoteAsset: Asset) => Promise<PerpMarket[]>;
    fetchPerpFundingRate: (asset: Asset) => Promise<BN>;
    fetchPerpMaxAbsPositionSize: (accountAddress: string, asset: Asset) => Promise<PerpMaxAbsPositionSize>;
    fetchPerpPendingFundingPayment: (accountAddress: string, asset: Asset) => Promise<PerpPendingFundingPayment>;
    fetchPerpMarkPrice: (asset: Asset) => Promise<BN>;
    fetchWalletBalance: (asset: Asset) => Promise<string>;
    getProviderWallet: () => Promise<WalletUnlocked>;
    getProvider: () => Promise<Provider>;
    private getFetchOptions;
    private getApiOptions;
}
