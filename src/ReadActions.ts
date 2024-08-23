import { Address, Bech32Address, ZeroBytes32 } from "fuels";
import { Undefinable } from "tsdef";

import { MarketContract } from "./types/market";
import { AddressInput, IdentityInput } from "./types/market/MarketContract";
import { MultiassetContract } from "./types/multiasset";
import { OrderbookContract } from "./types/orderbook";
import { Vec } from "./types/orderbook/common";
import { AssetIdInput } from "./types/orderbook/OrderbookContract";
import BN from "./utils/BN";
import {
  AssetType,
  MarketInfo,
  Markets,
  Options,
  OrderType,
  SpotOrderWithoutTimestamp,
  UserMarketBalance,
} from "./interface";

export class ReadActions {
  getOrderbookVersion = async (
    options: Options,
  ): Promise<{ address: string; version: number }> => {
    const orderbookFactory = new OrderbookContract(
      options.contractAddresses.orderbook,
      options.wallet,
    );

    const data = await orderbookFactory.functions.config().get();

    return {
      address: data.value[0].bits,
      version: data.value[1],
    };
  };

  getAsset = async (
    symbol: string,
    options: Options,
  ): Promise<Undefinable<string>> => {
    const orderbookFactory = new MultiassetContract(
      options.contractAddresses.multiAsset,
      options.wallet,
    );

    const data = await orderbookFactory.functions.asset_get(symbol).get();

    return data.value?.bits;
  };

  fetchMarkets = async (
    assetIdPairs: [string, string][],
    options: Options,
  ): Promise<Markets> => {
    const orderbookFactory = new OrderbookContract(
      options.contractAddresses.orderbook,
      options.wallet,
    );

    console.log(options.contractAddresses.orderbook);

    const assetIdInput: Vec<[AssetIdInput, AssetIdInput]> = assetIdPairs.map(
      ([baseTokenId, quoteTokenId]) => [
        { bits: baseTokenId },
        { bits: quoteTokenId },
      ],
    );

    const data = await orderbookFactory.functions.markets(assetIdInput).get();

    console.log(data.value);

    const markets = data.value.reduce(
      (prev, [baseAssetId, quoteAssetId, contractId]) => {
        if (!contractId) return prev;

        return {
          ...prev,
          [`${baseAssetId.bits}-${quoteAssetId.bits}`]:
            contractId?.bits ?? ZeroBytes32,
        };
      },
      {} as Markets,
    );

    return markets;
  };

  fetchMarketConfig = async (
    marketAddress: string,
    options: Options,
  ): Promise<MarketInfo> => {
    const marketFactory = new MarketContract(marketAddress, options.wallet);

    const data = await marketFactory.functions.config().get();

    const market: MarketInfo = {
      owner: data.value[0].bits,
      baseAssetId: data.value[1].bits,
      baseAssetDecimals: data.value[2],
      quoteAssetId: data.value[3].bits,
      quoteAssetDecimals: data.value[4],
      priceDecimals: data.value[5],
      feeAssetId: data.value[6].bits,
    };

    return market;
  };

  fetchMarketPrice = async (baseToken: string): Promise<BN> => {
    console.warn("[fetchMarketPrice] NOT IMPLEMENTED FOR FUEL");
    return BN.ZERO;
  };

  fetchUserMarketBalance = async (
    trader: Bech32Address,
    options: Options,
  ): Promise<UserMarketBalance> => {
    const marketFactory = new MarketContract(
      options.contractAddresses.market,
      options.wallet,
    );

    const traderAddress = new Address(trader).toB256();

    const address: AddressInput = {
      bits: traderAddress,
    };

    const user: IdentityInput = {
      Address: address,
    };

    const result = await marketFactory.functions.account(user).get();

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
    const marketFactory = new MarketContract(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions.order(orderId).get();

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
    trader: Bech32Address,
    options: Options,
  ): Promise<string[]> => {
    const marketFactory = new MarketContract(
      options.contractAddresses.market,
      options.wallet,
    );

    const traderAddress = new Address(trader).toB256();

    const address: AddressInput = {
      bits: traderAddress,
    };

    const user: IdentityInput = {
      Address: address,
    };

    const result = await marketFactory.functions.user_orders(user).get();

    return result.value;
  };

  fetchWalletBalance = async (
    assetId: string,
    options: Options,
  ): Promise<string> => {
    const balance = await options.wallet.getBalance(assetId);
    return balance.toString();
  };

  fetchMatcherFee = async (options: Options): Promise<number> => {
    const marketFactory = new MarketContract(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions.matcher_fee().get();

    return result.value;
  };

  fetchProtocolFee = async (options: Options): Promise<number> => {
    const marketFactory = new MarketContract(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions.protocol_fee().get();

    return result.value;
  };

  fetchProtocolFeeForAmount = async (
    amount: string,
    options: Options,
  ): Promise<string> => {
    const marketFactory = new MarketContract(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions
      .protocol_fee_amount(amount)
      .get();

    return result.value.toString();
  };
}
