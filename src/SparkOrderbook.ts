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
  SparkParams,
  SpotOrderWithoutTimestamp,
  TradeOrderEvent,
  UserMarketBalance,
  Volume,
  WithdrawAllType,
  WriteTransactionResponse,
} from "./interface";
import { ReadActions } from "./ReadActions";
import { WriteActions } from "./WriteActions";

export class SparkOrderbook {
  private write = new WriteActions();

  private providerPromise: Promise<Provider>;
  private provider: Undefinable<Provider>;
  private options: OptionsSpark;

  private indexerApi: Undefinable<IndexerApi>;

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

  get activeIndexerApi() {
    if (!this.indexerApi) {
      throw new Error("Please set correct active indexer");
    }

    return this.indexerApi;
  }

  getRead = async (shouldWrite?: boolean) => {
    const optionsFunc = shouldWrite
      ? this.getWriteOptions
      : this.getReadOptions;
    const options = await optionsFunc();
    return new ReadActions(options);
  };

  getWrite = () => {
    const options = this.getWriteOptions();
    return new WriteActions(options);
  };

  setActiveWallet = (wallet?: WalletLocked | WalletUnlocked) => {
    const newOptions = { ...this.options };
    newOptions.wallet = wallet;
    this.options = newOptions;
  };

  setActiveMarket = (contractAddress: string, indexer: GraphClientConfig) => {
    this.options = {
      ...this.options,
      contractAddresses: {
        ...this.options.contractAddresses,
        market: contractAddress,
      },
    };

    if (this.indexerApi) {
      this.indexerApi.close();
    }

    this.indexerApi = new IndexerApi(indexer);
  };

  createOrder = async (
    order: CreateOrderParams,
  ): Promise<WriteTransactionResponse> => {
    return this.write.createOrder(order, this.getWriteOptions());
  };

  createOrderWithDeposit = async (
    order: CreateOrderWithDepositParams,
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> => {
    return this.write.createOrderWithDeposit(
      order,
      allMarketContracts,
      this.getWriteOptions(),
    );
  };

  fulfillOrderManyWithDeposit = async (
    order: FulfillOrderManyWithDepositParams,
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> => {
    return this.write.fulfillOrderManyWithDeposit(
      order,
      allMarketContracts,
      this.getWriteOptions(),
    );
  };

  cancelOrder = async (orderId: string): Promise<WriteTransactionResponse> => {
    return this.write.cancelOrder(orderId, this.getWriteOptions());
  };

  matchOrders = async (
    sellOrderId: string,
    buyOrderId: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.matchOrders(
      sellOrderId,
      buyOrderId,
      this.getWriteOptions(),
    );
  };

  fulfillOrderMany = async (
    order: FulfillOrderManyParams,
  ): Promise<WriteTransactionResponse> => {
    return this.write.fulfillOrderMany(order, this.getWriteOptions());
  };

  mintToken = async (
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.mintToken(token, amount, this.getWriteOptions());
  };

  deposit = async (
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.deposit(token, amount, this.getWriteOptions());
  };

  withdraw = async (
    amount: string,
    assetType: AssetType,
  ): Promise<WriteTransactionResponse> => {
    return this.write.withdraw(amount, assetType, this.getWriteOptions());
  };

  withdrawAll = async (
    assets: WithdrawAllType[],
  ): Promise<WriteTransactionResponse> => {
    return this.write.withdrawAll(assets, this.getWriteOptions());
  };

  withdrawAssets = async (
    assetType: AssetType,
    allMarketContracts: string[],
    amount?: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.withdrawAssets(
      assetType,
      allMarketContracts,
      this.getWriteOptions(),
      amount,
    );
  };

  withdrawAllAssets = async (
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> => {
    return this.write.withdrawAllAssets(
      allMarketContracts,
      this.getWriteOptions(),
    );
  };

  fetchOrders = async (
    params: GetOrdersParams,
  ): Promise<ApolloQueryResult<{ Order: Order[] }>> => {
    return this.activeIndexerApi.getOrders(params);
  };

  fetchActiveOrders = async <T extends OrderType>(
    params: GetActiveOrdersParams,
  ): Promise<ApolloQueryResult<ActiveOrderReturn<T>>> => {
    return this.activeIndexerApi.getActiveOrders<T>(params);
  };

  subscribeOrders = (
    params: GetOrdersParams,
  ): Observable<FetchResult<{ Order: Order[] }>> => {
    return this.activeIndexerApi.subscribeOrders(params);
  };

  subscribeActiveOrders = <T extends OrderType>(
    params: GetActiveOrdersParams,
  ): Observable<FetchResult<ActiveOrderReturn<T>>> => {
    return this.activeIndexerApi.subscribeActiveOrders<T>(params);
  };

  subscribeTradeOrderEvents = (
    params: GetTradeOrderEventsParams,
  ): Observable<FetchResult<{ TradeOrderEvent: TradeOrderEvent[] }>> => {
    return this.activeIndexerApi.subscribeTradeOrderEvents(params);
  };

  fetchVolume = async (params: GetTradeOrderEventsParams): Promise<Volume> => {
    return this.activeIndexerApi.getVolume(params);
  };

  fetchMarkets = async (assetIdPairs: [string, string][]): Promise<Markets> => {
    const read = await this.getRead();
    return read.fetchMarkets(assetIdPairs);
  };

  fetchMarketConfig = async (marketAddress: string): Promise<MarketInfo> => {
    const read = await this.getRead();
    return read.fetchMarketConfig(marketAddress);
  };

  fetchOrderById = async (
    orderId: string,
  ): Promise<SpotOrderWithoutTimestamp | undefined> => {
    const read = await this.getRead();
    return read.fetchOrderById(orderId);
  };

  fetchWalletBalance = async (asset: Asset): Promise<string> => {
    const read = await this.getRead(true);
    return read.fetchWalletBalance(asset.assetId);
  };

  fetchOrderIdsByAddress = async (trader: Bech32Address): Promise<string[]> => {
    const read = await this.getRead();
    return read.fetchOrderIdsByAddress(trader);
  };

  fetchUserMarketBalance = async (
    trader: Bech32Address,
  ): Promise<UserMarketBalance> => {
    const read = await this.getRead();
    return read.fetchUserMarketBalance(trader);
  };

  fetchUserMarketBalanceByContracts = async (
    trader: Bech32Address,
    contractsAddresses: string[],
  ): Promise<UserMarketBalance[]> => {
    const read = await this.getRead();
    return read.fetchUserMarketBalanceByContracts(trader, contractsAddresses);
  };

  fetchMatcherFee = async () => {
    const read = await this.getRead();
    return read.fetchMatcherFee();
  };

  fetchProtocolFee = async () => {
    const read = await this.getRead();
    return read.fetchProtocolFee();
  };

  fetchProtocolFeeForUser = async (trader: Bech32Address) => {
    const read = await this.getRead();
    return read.fetchProtocolFeeForUser(trader);
  };

  fetchProtocolFeeAmountForUser = async (
    amount: string,
    trader: Bech32Address,
  ) => {
    const read = await this.getRead();
    return read.fetchProtocolFeeAmountForUser(amount, trader);
  };

  getVersion = async () => {
    const read = await this.getRead();
    return read.getOrderbookVersion();
  };

  getAsset = async (symbol: string) => {
    const read = await this.getRead();
    return read.getAsset(symbol);
  };

  getProviderWallet = async () => {
    const provider = await this.getProvider();
    return Wallet.generate({ provider });
  };

  getProvider = async () => {
    if (this.provider) {
      return this.provider;
    }

    this.provider = await this.providerPromise;

    return this.provider;
  };

  private getReadOptions = async (): Promise<Options> => {
    const providerWallet = await this.getProviderWallet();
    const options: Options = { ...this.options, wallet: providerWallet };

    return options;
  };

  private getWriteOptions = (): Options => {
    if (!this.options.wallet) {
      throw new NetworkError(NETWORK_ERROR.UNKNOWN_WALLET);
    }

    return this.options as Options;
  };
}
