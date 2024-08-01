import { B256Address } from "fuels";

import { MarketContractAbi__factory } from "./types/market";
import { AddressInput, IdentityInput } from "./types/market/MarketContractAbi";
import BN from "./utils/BN";
import {
  AssetType,
  Options,
  OrderType,
  SpotOrderWithoutTimestamp,
  UserMarketBalance,
} from "./interface";

export class ReadActions {
  fetchMarketPrice = async (baseToken: string): Promise<BN> => {
    console.warn("[fetchMarketPrice] NOT IMPLEMENTED FOR FUEL");
    return BN.ZERO;
  };

  fetchUserMarketBalance = async (
    trader: B256Address,
    options: Options,
  ): Promise<UserMarketBalance> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const address: AddressInput = {
      bits: trader,
    };

    const user: IdentityInput = {
      Address: address,
    };

    const result = await orderbookFactory.functions.account(user).get();

    const locked = {
      base: result.value?.locked.base.toString() ?? BN.ZERO.toString(),
      quote: result.value?.locked.quote.toString() ?? BN.ZERO.toString(),
    };

    const liquid = {
      base: result.value?.liquid.base.toString() ?? BN.ZERO.toString(),
      quote: result.value?.liquid.quote.toString() ?? BN.ZERO.toString(),
    };

    return {
      liquid,
      locked,
    };
  };

  fetchOrderById = async (
    orderId: string,
    options: Options,
  ): Promise<SpotOrderWithoutTimestamp | undefined> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await orderbookFactory.functions.order(orderId).get();

    if (!result.value) return undefined;

    const baseSize = new BN(result.value.amount.toString());
    const basePrice = new BN(result.value.price.toString());

    return {
      id: orderId,
      assetType: result.value.asset_type as unknown as AssetType,
      orderType: result.value.order_type as unknown as OrderType,
      trader: result.value.owner.Address?.bits ?? "",
      baseSize,
      orderPrice: basePrice,
    };
  };

  fetchOrderIdsByAddress = async (
    trader: B256Address,
    options: Options,
  ): Promise<string[]> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const address: AddressInput = {
      bits: trader,
    };

    const user: IdentityInput = {
      Address: address,
    };

    const result = await orderbookFactory.functions.user_orders(user).get();

    return result.value;
  };

  fetchWalletBalance = async (
    assetId: string,
    options: Options,
  ): Promise<string> => {
    const balance = await options.wallet.getBalance(assetId);
    return balance.toString();
  };
}
