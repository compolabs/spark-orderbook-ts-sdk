import { Asset, Options } from "./interface";
export declare class WriteActions {
    createSpotOrder: (baseToken: Asset, quoteToken: Asset, size: string, price: string, options: Options) => Promise<string>;
    cancelSpotOrder: (orderId: string, options: Options) => Promise<void>;
    mintToken: (token: Asset, amount: string, options: Options) => Promise<void>;
    approve: (assetAddress: string, amount: string) => Promise<void>;
    allowance: (assetAddress: string) => Promise<string>;
    depositPerpCollateral: (assetAddress: string, amount: string, options: Options) => Promise<void>;
    withdrawPerpCollateral: (baseTokenAddress: string, gasTokenAddress: string, amount: string, updateData: string[], options: Options) => Promise<void>;
    openPerpOrder: (baseTokenAddress: string, gasTokenAddress: string, amount: string, price: string, updateData: string[], options: Options) => Promise<string>;
    removePerpOrder: (orderId: string, options: Options) => Promise<void>;
    fulfillPerpOrder: (gasTokenAddress: string, orderId: string, amount: string, updateData: string[], options: Options) => Promise<void>;
}
