import { ApolloQueryResult, FetchResult, Observable } from "@apollo/client";
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
  CompactMarketInfo,
  CreateOrderParams,
  CreateOrderWithDepositParams,
  FulfillOrderManyParams,
  FulfillOrderManyWithDepositParams,
  GetActiveOrdersParams,
  GetBalancePnlByUserParams,
  GetCompetitionParams,
  GetLeaderboardPnlQueryParams,
  GetLeaderboardQueryParams,
  GetOrdersParams,
  GetOrdersSort,
  GetSortedLeaderboardPnlQueryParams,
  GetSortedLeaderboardQueryParams,
  GetTotalStatsTableDataParams,
  GetTradeEventQueryParams,
  GetTradeOrderEventsParams,
  GetUserPointQueryParams,
  GetUserScoreSnapshotParams,
  GraphClientConfig,
  MarketInfo,
  Markets,
  Options,
  OptionsSpark,
  Order,
  OrderType,
  ProtocolFee,
  SentioApiParams,
  SparkParams,
  SpotOrderWithoutTimestamp,
  TradeOrderEvent,
  UserInfo,
  UserInfoParams,
  UserMarketBalance,
  UserProtocolFee,
  Volume,
  WithdrawAllType,
  WriteTransactionResponse,
} from "./interface";
import { ReadActions } from "./ReadActions";
import { SentioApi } from "./sentioApi";
import { WriteActions } from "./WriteActions";

export class SparkOrderbook {
  private providerPromise: Promise<Provider>;
  private provider?: Provider;
  private options: OptionsSpark;
  private indexerApi?: IndexerApi;
  private sentioApi?: SentioApi;

  constructor(params: SparkParams) {
    this.options = {
      contractAddresses: {
        proxyMarket: "",
        ...params.contractAddresses,
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

  private get activeSentioApi(): SentioApi {
    if (!this.sentioApi) {
      throw new Error("Please set the correct active indexer.");
    }
    return this.sentioApi;
  }

  async getProvider(): Promise<Provider> {
    if (!this.provider) {
      this.provider = await this.providerPromise;
    }
    return this.provider;
  }

  async getProviderWallet(): Promise<WalletUnlocked> {
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
    this.options.contractAddresses.proxyMarket = contractAddress;

    if (this.indexerApi) {
      this.indexerApi.close();
    }

    this.indexerApi = new IndexerApi(indexer);
  }

  setSentioConfig(params: SentioApiParams): void {
    this.sentioApi = new SentioApi(params);
  }

  async createOrder(
    order: CreateOrderParams,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().createOrder(order);
  }

  async createOrderWithDeposit(
    order: CreateOrderWithDepositParams,
    markets: CompactMarketInfo[],
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().createOrderWithDeposit(order, markets);
  }

  async fulfillOrderManyWithDeposit(
    order: FulfillOrderManyWithDepositParams,
    markets: CompactMarketInfo[],
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().fulfillOrderManyWithDeposit(order, markets);
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
    assetId: string,
    markets: CompactMarketInfo[],
    amount: string,
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().withdrawAssets(assetId, markets, amount);
  }

  async withdrawAllAssets(
    markets: CompactMarketInfo[],
  ): Promise<WriteTransactionResponse> {
    return this.getWrite().withdrawAllAssets(markets);
  }

  async fetchOrders(
    params: GetOrdersParams,
    orderBy?: GetOrdersSort,
  ): Promise<ApolloQueryResult<{ Order: Order[] }>> {
    return this.activeIndexerApi.getOrders(params, orderBy);
  }

  async fetchActiveOrders<T extends OrderType>(
    params: GetActiveOrdersParams,
    orderBy?: GetOrdersSort,
  ): Promise<ApolloQueryResult<ActiveOrderReturn<T>>> {
    return this.activeIndexerApi.getActiveOrders<T>(params, orderBy);
  }

  subscribeOrders(
    params: GetOrdersParams,
    orderBy?: GetOrdersSort,
  ): Observable<FetchResult<{ Order: Order[] }>> {
    return this.activeIndexerApi.subscribeOrders(params, orderBy);
  }

  subscribeActiveOrders<T extends OrderType>(
    params: GetActiveOrdersParams,
    orderBy?: GetOrdersSort,
  ): Observable<FetchResult<ActiveOrderReturn<T>>> {
    return this.activeIndexerApi.subscribeActiveOrders<T>(params, orderBy);
  }

  subscribeTradeOrderEvents(
    params: GetTradeOrderEventsParams,
  ): Observable<FetchResult<{ TradeOrderEvent: TradeOrderEvent[] }>> {
    return this.activeIndexerApi.subscribeTradeOrderEvents(params);
  }

  async fetchVolume(params: GetTradeOrderEventsParams): Promise<Volume> {
    return this.activeIndexerApi.getVolume(params);
  }

  subscribeUserInfo(
    params: UserInfoParams,
  ): Observable<FetchResult<{ User: UserInfo[] }>> {
    return this.activeIndexerApi.subscribeUserInfo(params);
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

  async fetchMinOrderSize(): Promise<string> {
    const read = await this.getRead();
    return read.fetchMinOrderSize();
  }

  async fetchMinOrderPrice(): Promise<string> {
    const read = await this.getRead();
    return read.fetchMinOrderPrice();
  }

  async getUserScoreSnapshot(params: GetUserScoreSnapshotParams) {
    return this.activeSentioApi?.getUserScoreSnapshot(params);
  }

  async getTradeEvent(params: GetTradeEventQueryParams) {
    return this.activeSentioApi?.getTradeEvent(params);
  }

  async getSortedLeaderboard(params: GetSortedLeaderboardQueryParams) {
    return this.activeSentioApi?.getSortedLeaderboard(params);
  }

  async getLeaderboard(params: GetLeaderboardQueryParams) {
    return this.activeSentioApi?.getLeaderboardQuery(params);
  }

  async getLastTrades(params: GetOrdersParams) {
    return this.activeIndexerApi?.getLastTrades(params);
  }

  async getLeaderboardPnl(params: GetLeaderboardPnlQueryParams) {
    return this.activeSentioApi.getLeaderboardPnl(params);
  }

  async getSortedLeaderboardPnl(params: GetSortedLeaderboardPnlQueryParams) {
    return this.activeSentioApi.getSortedLeaderboardPnl(params);
  }

  async getUserPoints(params: GetUserPointQueryParams) {
    return this.activeSentioApi.getUserPoints(params);
  }

  async getTotalStats() {
    return this.activeSentioApi.getTotalStats();
  }

  async getTotalStatsTableData(params: GetTotalStatsTableDataParams) {
    return this.activeSentioApi.getTotalStatsTableData(params);
  }

  async getCompetition(params: GetCompetitionParams) {
    return this.activeSentioApi.getCompetition(params);
  }
  
  async getBalancePnlByUser(params: GetBalancePnlByUserParams) {
    return this.activeSentioApi.getBalancePnlByUser(params);
  }
  /**
   * @experimental
   * Returns the current instance to allow method chaining.
   * @returns {this} The current instance of the object.
   */
  chain(): this {
    return this;
  }

  /**
   * @experimental
   * Returns the current instance to allow method chaining.
   * @returns {this} The current instance of the object.
   */
  writeWithMarket(marketAddress: string): SparkOrderbook {
    const params = {
      ...this.options,
      contractAddresses: {
        ...this.options.contractAddresses,
        proxyMarket: marketAddress,
        market: marketAddress,
      },
      networkUrl: this.provider!.url,
    };

    return new SparkOrderbook(params);
  }
}
