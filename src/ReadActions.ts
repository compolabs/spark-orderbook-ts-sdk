import {
  Address,
  Bech32Address,
  FunctionInvocationScope,
  MultiCallInvocationScope,
  ZeroBytes32,
} from "fuels";
import { Undefinable } from "tsdef";

import { AccountOutput, IdentityInput } from "./types/market/SparkMarket";
import { Vec } from "./types/registry/common";
import { AssetIdInput } from "./types/registry/SparkRegistry";

import BN from "./utils/BN";
import { createContract } from "./utils/createContract";
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
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  private get marketFactory() {
    return createContract("SparkMarket", this.options);
  }

  private get registryFactory() {
    return createContract("SparkRegistry", this.options);
  }

  private get assetsFactory() {
    return createContract("MultiassetContract", this.options);
  }

  private getMarketFactory(address?: string) {
    return createContract("SparkMarket", this.options, address);
  }

  private get proxyContract() {
    if (!this.options.contractAddresses.proxy) {
      return;
    }

    return createContract(
      "SparkProxy",
      this.options,
      this.options.contractAddresses.proxy,
    );
  }

  private async fetchData<TReturn>(
    createTx: () =>
      | FunctionInvocationScope<any, TReturn>
      | MultiCallInvocationScope<TReturn>,
  ): Promise<TReturn> {
    let tx = createTx();

    if (this.proxyContract) {
      tx = tx.addContracts([this.proxyContract]);
    }

    const result = await tx.get();

    return result.value;
  }

  private createIdentityInput(trader: Bech32Address): IdentityInput {
    return {
      Address: {
        bits: new Address(trader).toB256(),
      },
    };
  }

  async getOrderbookVersion(): Promise<{ address: string; version: number }> {
    const data = await this.registryFactory.functions.config().get();

    return {
      address:
        data.value[0]?.Address?.bits ?? data.value[0]?.ContractId?.bits ?? "",
      version: data.value[1],
    };
  }

  async getAsset(symbol: string): Promise<Undefinable<string>> {
    const data = await this.assetsFactory.functions.asset_get(symbol).get();

    return data.value?.bits;
  }

  async fetchMarkets(assetIdPairs: [string, string][]): Promise<Markets> {
    const assetIdInput: Vec<[AssetIdInput, AssetIdInput]> = assetIdPairs.map(
      ([baseTokenId, quoteTokenId]) => [
        { bits: baseTokenId },
        { bits: quoteTokenId },
      ],
    );

    const data = await this.registryFactory.functions
      .markets(assetIdInput)
      .get();

    return data.value.reduce(
      (prev, [baseAssetId, quoteAssetId, contractId]) => {
        if (!contractId) return prev;

        return {
          ...prev,
          [`${baseAssetId.bits}-${quoteAssetId.bits}`]:
            contractId.bits ?? ZeroBytes32,
        };
      },
      {} as Markets,
    );
  }

  async fetchMarketConfig(marketAddress: string): Promise<MarketInfo> {
    const marketFactory = this.getMarketFactory(marketAddress);

    const data = await this.fetchData(marketFactory.functions.config);

    const [
      baseAssetId,
      baseAssetDecimals,
      quoteAssetId,
      quoteAssetDecimals,
      ownerIdentity,
      priceDecimals,
      version,
    ] = data;

    const owner =
      ownerIdentity?.Address?.bits ?? ownerIdentity?.ContractId?.bits ?? "";

    return {
      baseAssetId: baseAssetId.bits,
      baseAssetDecimals,
      quoteAssetId: quoteAssetId.bits,
      quoteAssetDecimals,
      owner,
      priceDecimals,
      version,
    };
  }

  async fetchUserMarketBalance(
    trader: Bech32Address,
  ): Promise<UserMarketBalance> {
    const user = this.createIdentityInput(trader);
    const result = await this.fetchData(() =>
      this.marketFactory.functions.account(user),
    );

    const { liquid, locked } = result ?? {};

    return {
      liquid: {
        base: liquid?.base.toString() ?? "0",
        quote: liquid?.quote.toString() ?? "0",
      },
      locked: {
        base: locked?.base.toString() ?? "0",
        quote: locked?.quote.toString() ?? "0",
      },
    };
  }

  async fetchUserMarketBalanceByContracts(
    trader: Bech32Address,
    contractsAddresses: string[],
  ): Promise<UserMarketBalance[]> {
    const user = this.createIdentityInput(trader);
    const calls = contractsAddresses.map((address) => {
      const market = this.getMarketFactory(address);
      return market.functions.account(user);
    });

    const baseMarketContract = this.getMarketFactory(contractsAddresses[0]);
    const result = await this.fetchData(() =>
      baseMarketContract.multiCall(calls),
    );

    return result.value.map((data: AccountOutput) => ({
      liquid: {
        base: data.liquid.base.toString() ?? "0",
        quote: data.liquid.quote.toString() ?? "0",
      },
      locked: {
        base: data.locked.base.toString() ?? "0",
        quote: data.locked.quote.toString() ?? "0",
      },
    }));
  }

  async fetchOrderById(
    orderId: string,
  ): Promise<Undefinable<SpotOrderWithoutTimestamp>> {
    const result = await this.fetchData(() =>
      this.marketFactory.functions.order(orderId),
    );

    if (!result) return;

    const { amount, price, order_type, owner } = result;

    return {
      id: orderId,
      orderType: order_type as unknown as OrderType,
      trader: owner.Address?.bits ?? "",
      baseSize: new BN(amount.toString()),
      orderPrice: new BN(price.toString()),
    };
  }

  async fetchOrderIdsByAddress(trader: Bech32Address): Promise<string[]> {
    const user = this.createIdentityInput(trader);
    const result = await this.fetchData(() =>
      this.marketFactory.functions.user_orders(user),
    );

    return result;
  }

  async fetchWalletBalance(assetId: string): Promise<string> {
    const balance = await this.options.wallet.getBalance(assetId);
    return balance.toString();
  }

  async fetchMatcherFee(): Promise<string> {
    const result = await this.fetchData(
      this.marketFactory.functions.matcher_fee,
    );

    return result.toString();
  }

  async fetchProtocolFee(): Promise<ProtocolFee[]> {
    const result = await this.fetchData(
      this.marketFactory.functions.protocol_fee,
    );

    return result.map((fee) => ({
      makerFee: fee.maker_fee.toString(),
      takerFee: fee.taker_fee.toString(),
      volumeThreshold: fee.volume_threshold.toString(),
    }));
  }

  async fetchProtocolFeeForUser(
    trader: Bech32Address,
  ): Promise<UserProtocolFee> {
    const user = this.createIdentityInput(trader);
    const result = await this.fetchData(() =>
      this.marketFactory.functions.protocol_fee_user(user),
    );

    return {
      makerFee: result[0].toString(),
      takerFee: result[1].toString(),
    };
  }

  async fetchProtocolFeeAmountForUser(
    amount: string,
    trader: Bech32Address,
  ): Promise<UserProtocolFee> {
    const user = this.createIdentityInput(trader);
    const result = await this.fetchData(() =>
      this.marketFactory.functions.protocol_fee_user_amount(amount, user),
    );

    return {
      makerFee: result[0].toString(),
      takerFee: result[1].toString(),
    };
  }

  async fetchMinOrderSize(): Promise<string> {
    const result = await this.fetchData(
      this.marketFactory.functions.min_order_size,
    );

    return result.toString();
  }

  async fetchMinOrderPrice(): Promise<string> {
    const result = await this.fetchData(
      this.marketFactory.functions.min_order_price,
    );

    return result.toString();
  }
}
