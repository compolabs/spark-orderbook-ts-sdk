import { ApolloQueryResult } from "@apollo/client";
import {
  Bech32Address,
  Provider,
  Wallet,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { Undefinable } from "tsdef";

import { NETWORK_ERROR, NetworkError } from "./utils/NetworkError";
import { DEFAULT_GAS_LIMIT_MULTIPLIER, DEFAULT_GAS_PRICE } from "./constants";
import { IndexerApi } from "./IndexerApi";
import {
  ActiveOrderReturn,
  Asset,
  AssetType,
  CreateOrderParams,
  CreateOrderWithDepositParams,
  FulfillOrderManyParams,
  FulfillOrderManyWithDepositParams,
  GetActiveOrdersParams,
  GetOrdersParams,
  GetTradeOrderEventsParams,
  GraphClientConfig,
  MarketInfo,
  Markets,
  Options,
  OptionsSpark,
  Order,
  OrderType,
  ProtocolFee,
  SparkParams,
  SpotOrderWithoutTimestamp,
  UserMarketBalance,
  UserProtocolFee,
  Volume,
  WithdrawAllType,
  WriteTransactionResponse,
} from "./interface";
import { ReadActions } from "./ReadActions";
import { WriteActions } from "./WriteActions";

export class SparkOrderbook {
  private providerPromise: Promise<Provider>;
  private provider?: Provider;
  private options: OptionsSpark;
  private indexerApi?: IndexerApi;

  constructor(params: SparkParams) {
    this.options = {
      contractAddresses: {
        ...params.contractAddresses,
        market: "",
      },
      wallet: params.wallet,
      gasPrice: params.gasPrice ?? DEFAULT_GAS_PRICE,
      gasLimitMultiplier:
        params.gasLimitMultiplier ?? DEFAULT_GAS_LIMIT_MULTIPLIER,
    };

    this.providerPromise = Provider.create(params.networkUrl);
  }

  private get activeIndexerApi(): IndexerApi {
    if (!this.indexerApi) {
      throw new Error("Please set the correct active indexer.");
    }
    return this.indexerApi;
  }

  private async getProvider(): Promise<Provider> {
    if (!this.provider) {
      this.provider = await this.providerPromise;
    }
    return this.provider;
  }

  private async getProviderWallet(): Promise<WalletUnlocked> {
    const provider = await this.getProvider();
    return Wallet.generate({ provider });
  }

  private async getReadOptions(): Promise<Options> {
    const providerWallet = await this.getProviderWallet();
    return { ...this.options, wallet: providerWallet };
  }

  private getWriteOptions(): Options {
    if (!this.options.wallet) {
      throw new NetworkError(NETWORK_ERROR.UNKNOWN_WALLET);
    }
    return this.options as Options;
  }

  private async getRead(shouldWrite = false): Promise<ReadActions> {
    const options = shouldWrite
      ? this.getWriteOptions()
      : await this.getReadOptions();
    return new ReadActions(options);
  }

  private getWrite(): WriteActions {
    const options = this.getWriteOptions();
    return new WriteActions(options);
  }

  setActiveWallet(wallet?: WalletLocked | WalletUnlocked): void {
    this.options.wallet = wallet;
  }

  setActiveMarket(contractAddress: string, indexer: GraphClientConfig): void {
    this.options.contractAddresses.market = contractAddress;

    if (this.indexerApi) {
      this.indexerApi.close();
    }

    this.indexerApi = new IndexerApi(indexer);
  }

  async createOrder(
    order: CreateOrderParams,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().createOrder(order);
  }

  async createOrderWithDeposit(
    order: CreateOrderWithDepositParams,
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().createOrderWithDeposit(order, allMarketContracts);
  }

  async fulfillOrderManyWithDeposit(
    order: FulfillOrderManyWithDepositParams,
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().fulfillOrderManyWithDeposit(
      order,
      allMarketContracts,
    );
  }

  async cancelOrder(orderId: string): Promise<WriteTransactionResponse> {
    return this.getWrite().cancelOrder(orderId);
  }

  async matchOrders(
    sellOrderId: string,
    buyOrderId: string,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().matchOrders(sellOrderId, buyOrderId);
  }

  async fulfillOrderMany(
    order: FulfillOrderManyParams,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().fulfillOrderMany(order);
  }

  async mintToken(
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().mintToken(token, amount);
  }

  async deposit(
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().deposit(token, amount);
  }

  async withdraw(
    amount: string,
    assetType: AssetType,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().withdraw(amount, assetType);
  }

  async withdrawAll(
    assets: WithdrawAllType[],
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().withdrawAll(assets);
  }

  async withdrawAssets(
    assetType: AssetType,
    allMarketContracts: string[],
    amount?: string,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().withdrawAssets(
      assetType,
      allMarketContracts,
      amount,
    );
  }

  async withdrawAllAssets(
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().withdrawAllAssets(allMarketContracts);
  }

  async fetchOrders(
    params: GetOrdersParams,
  ): Promise<ApolloQueryResult<{ Order: Order[] }>> {
    return this.activeIndexerApi.getOrders(params);
  }

  async fetchActiveOrders<T extends OrderType>(
    params: GetActiveOrdersParams,
  ): Promise<ApolloQueryResult<ActiveOrderReturn<T>>> {
    return this.activeIndexerApi.getActiveOrders<T>(params);
  }

  subscribeOrders(params: GetOrdersParams): void {
    this.activeIndexerApi.subscribeOrders(params);
  }

  subscribeActiveOrders(params: GetActiveOrdersParams): void {
    this.activeIndexerApi.subscribeActiveOrders(params);
  }

  subscribeTradeOrderEvents(params: GetTradeOrderEventsParams): void {
    this.activeIndexerApi.subscribeTradeOrderEvents(params);
  }

  async fetchVolume(params: GetTradeOrderEventsParams): Promise<Volume> {
    return this.activeIndexerApi.getVolume(params);
  }

  async fetchMarkets(assetIdPairs: [string, string][]): Promise<Markets> {
    const read = await this.getRead();
    return read.fetchMarkets(assetIdPairs);
  }

  async fetchMarketConfig(marketAddress: string): Promise<MarketInfo> {
    const read = await this.getRead();
    return read.fetchMarketConfig(marketAddress);
  }

  async fetchOrderById(
    orderId: string,
  ): Promise<SpotOrderWithoutTimestamp | undefined> {
    const read = await this.getRead();
    return read.fetchOrderById(orderId);
  }

  async fetchWalletBalance(asset: Asset): Promise<string> {
    const read = await this.getRead(true);
    return read.fetchWalletBalance(asset.assetId);
  }

  async fetchOrderIdsByAddress(trader: Bech32Address): Promise<string[]> {
    const read = await this.getRead();
    return read.fetchOrderIdsByAddress(trader);
  }

  async fetchUserMarketBalance(
    trader: Bech32Address,
  ): Promise<UserMarketBalance> {
    const read = await this.getRead();
    return read.fetchUserMarketBalance(trader);
  }

  async fetchUserMarketBalanceByContracts(
    trader: Bech32Address,
    contractsAddresses: string[],
  ): Promise<UserMarketBalance[]> {
    const read = await this.getRead();
    return read.fetchUserMarketBalanceByContracts(trader, contractsAddresses);
  }

  async fetchMatcherFee(): Promise<string> {
    const read = await this.getRead();
    return read.fetchMatcherFee();
  }

  async fetchProtocolFee(): Promise<ProtocolFee[]> {
    const read = await this.getRead();
    return read.fetchProtocolFee();
  }

  async fetchProtocolFeeForUser(
    trader: Bech32Address,
  ): Promise<UserProtocolFee> {
    const read = await this.getRead();
    return read.fetchProtocolFeeForUser(trader);
  }

  async fetchProtocolFeeAmountForUser(
    amount: string,
    trader: Bech32Address,
  ): Promise<UserProtocolFee> {
    const read = await this.getRead();
    return read.fetchProtocolFeeAmountForUser(amount, trader);
  }

  async getVersion(): Promise<{ address: string; version: number }> {
    const read = await this.getRead();
    return read.getOrderbookVersion();
  }

  async getAsset(symbol: string): Promise<Undefinable<string>> {
    const read = await this.getRead();
    return read.getAsset(symbol);
  }
}
