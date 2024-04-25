import { Asset, Options } from "./interface";
export declare class WriteActions {
    createSpotOrder: (baseToken: Asset, quoteToken: Asset, size: string, price: string, options: Options) => Promise<string>;
    cancelSpotOrder: (orderId: string, options: Options) => Promise<string>;
    matchSpotOrders: (sellOrderId: string, buyOrderId: string, options: Options) => Promise<string>;
    mintToken: (token: Asset, amount: string, options: Options) => Promise<string>;
    depositPerpCollateral: (assetAddress: string, amount: string, options: Options) => Promise<string>;
    withdrawPerpCollateral: (baseTokenAddress: string, gasTokenAddress: string, amount: string, updateData: string[], options: Options) => Promise<string>;
    openPerpOrder: (baseTokenAddress: string, gasTokenAddress: string, amount: string, price: string, updateData: string[], options: Options) => Promise<string>;
    removePerpOrder: (orderId: string, options: Options) => Promise<string>;
    fulfillPerpOrder: (gasTokenAddress: string, orderId: string, amount: string, updateData: string[], options: Options) => Promise<string>;
    private sendTransaction;
}
