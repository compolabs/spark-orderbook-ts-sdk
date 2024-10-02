import { Address, Bech32Address, ZeroBytes32 } from "fuels";
import { Undefinable } from "tsdef";

import { SparkMarket } from "./types/market";
import {
  AccountOutput,
  AddressInput,
  IdentityInput,
} from "./types/market/SparkMarket";
import { MultiassetContract } from "./types/multiasset";
import { SparkRegistry } from "./types/registry";
import { Vec } from "./types/registry/common";
import { AssetIdInput } from "./types/registry/SparkRegistry";

import BN from "./utils/BN";
import {
  MarketInfo,
  Markets,
  Options,
  OrderType,
  ProtocolFee,
  SpotOrderWithoutTimestamp,
  UserMarketBalance,
  UserProtocolFee,
} from "./interface";

export class ReadActions {
  getOrderbookVersion = async (
    options: Options,
  ): Promise<{ address: string; version: number }> => {
    const registryFactory = new SparkRegistry(
      options.contractAddresses.registry,
      options.wallet,
    );

    const data = await registryFactory.functions.config().get();

    return {
      address: data.value[0].bits,
      version: data.value[1],
    };
  };

  getAsset = async (
    symbol: string,
    options: Options,
  ): Promise<Undefinable<string>> => {
    const assetsFactory = new MultiassetContract(
      options.contractAddresses.multiAsset,
      options.wallet,
    );

    const data = await assetsFactory.functions.asset_get(symbol).get();

    return data.value?.bits;
  };

  fetchMarkets = async (
    assetIdPairs: [string, string][],
    options: Options,
  ): Promise<Markets> => {
    const registryFactory = new SparkRegistry(
      options.contractAddresses.registry,
      options.wallet,
    );

    const assetIdInput: Vec<[AssetIdInput, AssetIdInput]> = assetIdPairs.map(
      ([baseTokenId, quoteTokenId]) => [
        { bits: baseTokenId },
        { bits: quoteTokenId },
      ],
    );

    const data = await registryFactory.functions.markets(assetIdInput).get();

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
    const marketFactory = new SparkMarket(marketAddress, options.wallet);

    const data = await marketFactory.functions.config().get();

    const market: MarketInfo = {
      baseAssetId: data.value[0].bits,
      baseAssetDecimals: data.value[1],
      quoteAssetId: data.value[2].bits,
      quoteAssetDecimals: data.value[3],
      owner:
        data.value[4].Address?.bits ?? data.value[4].ContractId?.bits ?? "",
      priceDecimals: data.value[5],
      version: data.value[6],
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
    const marketFactory = new SparkMarket(
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

  fetchUserMarketBalanceByContracts = async (
    trader: Bech32Address,
    contractsAddresses: string[],
    options: Options,
  ): Promise<UserMarketBalance[]> => {
    const traderAddress = new Address(trader).toB256();

    const address: AddressInput = {
      bits: traderAddress,
    };

    const user: IdentityInput = {
      Address: address,
    };

    const baseMarketContract = new SparkMarket(
      contractsAddresses[0],
      options.wallet,
    );

    const promises = contractsAddresses.map((contractAddress) => {
      return new SparkMarket(contractAddress, options.wallet).functions.account(
        user,
      );
    });

    const result = await baseMarketContract.multiCall(promises).get();

    return result.value.map((data: AccountOutput) => ({
      liquid: {
        base: data.liquid.base.toString() ?? BN.ZERO.toString(),
        quote: data.liquid.quote.toString() ?? BN.ZERO.toString(),
      },
      locked: {
        base: data.locked.base.toString() ?? BN.ZERO.toString(),
        quote: data.locked.quote.toString() ?? BN.ZERO.toString(),
      },
    }));
  };

  fetchOrderById = async (
    orderId: string,
    options: Options,
  ): Promise<SpotOrderWithoutTimestamp | undefined> => {
    const marketFactory = new SparkMarket(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions.order(orderId).get();

    if (!result.value) return undefined;

    const baseSize = new BN(result.value.amount.toString());
    const basePrice = new BN(result.value.price.toString());

    return {
      id: orderId,
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
    const marketFactory = new SparkMarket(
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

  fetchMatcherFee = async (options: Options): Promise<string> => {
    const marketFactory = new SparkMarket(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions.matcher_fee().get();

    return result.value.toString();
  };

  fetchProtocolFee = async (options: Options): Promise<ProtocolFee[]> => {
    const marketFactory = new SparkMarket(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await marketFactory.functions.protocol_fee().get();

    const data = result.value.map((fee) => ({
      makerFee: fee.maker_fee.toString(),
      takerFee: fee.taker_fee.toString(),
      volumeThreshold: fee.volume_threshold.toString(),
    }));

    return data;
  };

  fetchProtocolFeeForUser = async (
    trader: Bech32Address,
    options: Options,
  ): Promise<UserProtocolFee> => {
    const marketFactory = new SparkMarket(
      options.contractAddresses.market,
      options.wallet,
    );

    const identity: IdentityInput = {
      Address: {
        bits: new Address(trader).toB256(),
      },
    };

    const result = await marketFactory.functions
      .protocol_fee_user(identity)
      .get();

    return {
      makerFee: result.value[0].toString(),
      takerFee: result.value[1].toString(),
    };
  };

  fetchProtocolFeeAmountForUser = async (
    amount: string,
    trader: Bech32Address,
    options: Options,
  ): Promise<UserProtocolFee> => {
    const marketFactory = new SparkMarket(
      options.contractAddresses.market,
      options.wallet,
    );

    const identity: IdentityInput = {
      Address: {
        bits: new Address(trader).toB256(),
      },
    };

    const result = await marketFactory.functions
      .protocol_fee_user_amount(amount, identity)
      .get();

    return {
      makerFee: result.value[0].toString(),
      takerFee: result.value[1].toString(),
    };
  };
}
