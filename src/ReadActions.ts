import { Address, Bech32Address } from "fuels";

import { MarketContractAbi__factory } from "./types/market";
import { AddressInput, IdentityInput } from "./types/market/MarketContractAbi";
import { OrderbookContractAbi__factory } from "./types/orderbook";
import { Vec } from "./types/orderbook/common";
import { AssetIdInput } from "./types/orderbook/OrderbookContractAbi";
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
  fetchMarkets = async (
    assetIds: string[],
    options: Options,
  ): Promise<Markets> => {
    console.log(options.contractAddresses.orderbook);
    const orderbookFactory = OrderbookContractAbi__factory.connect(
      options.contractAddresses.orderbook,
      options.wallet,
    );

    const assetIdInput: Vec<AssetIdInput> = assetIds.map((assetId) => ({
      bits: assetId,
    }));

    console.log("123123", assetIdInput);

    const data = await orderbookFactory.functions
      .registered_markets([
        {
          bits: "0xccceae45a7c23dcd4024f4083e959a0686a191694e76fa4fb76c449361ca01f7",
        },
      ])
      .get();

    console.log("data", data);

    const markets = data.value.reduce((prev, [assetId, contractId]) => {
      return {
        ...prev,
        [assetId.bits]: contractId?.bits,
      };
    }, {} as Markets);

    return markets;
  };

  fetchMarketConfig = async (
    marketAddress: string,
    options: Options,
  ): Promise<MarketInfo> => {
    const marketFactory = MarketContractAbi__factory.connect(
      marketAddress,
      options.wallet,
    );

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
    const marketFactory = MarketContractAbi__factory.connect(
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
    const marketFactory = MarketContractAbi__factory.connect(
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
    const marketFactory = MarketContractAbi__factory.connect(
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
    const marketFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions.matcher_fee().get();

    return result.value;
  };

  fetchProtocolFee = async (options: Options): Promise<number> => {
    const marketFactory = MarketContractAbi__factory.connect(
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
    const marketFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions
      .protocol_fee_amount(amount)
      .get();

    return result.value.toString();
  };
}
