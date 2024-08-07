import { ApolloQueryResult, FetchResult, Observable } from "@apollo/client";
import {
  Bech32Address,
  Provider,
  Wallet,
  WalletLocked,
  WalletUnlocked,
} from "fuels";

import BN from "./utils/BN";
import { NETWORK_ERROR, NetworkError } from "./utils/NetworkError";
import {
  BETA_CONTRACT_ADDRESSES,
  DEFAULT_GAS_LIMIT_MULTIPLIER,
  DEFAULT_GAS_PRICE,
} from "./constants";
import { IndexerApi } from "./IndexerApi";
import {
  ActiveOrderReturn,
  Asset,
  AssetType,
  CreateOrderParams,
  FulfillOrderManyParams,
  GetActiveOrdersParams,
  GetOrdersParams,
  GetTradeOrderEventsParams,
  MarketCreateEvent,
  Options,
  OptionsSpark,
  Order,
  OrderType,
  SparkParams,
  SpotOrderWithoutTimestamp,
  TradeOrderEvent,
  UserMarketBalance,
  Volume,
  WriteTransactionResponse,
} from "./interface";
import { ReadActions } from "./ReadActions";
import { WriteActions } from "./WriteActions";

export class SparkOrderbook {
  private read = new ReadActions();
  private write = new WriteActions();

  private providerPromise: Promise<Provider>;
  private options: OptionsSpark;

  private indexerApi: IndexerApi;

  constructor(params: SparkParams) {
    this.options = {
      contractAddresses: params.contractAddresses ?? BETA_CONTRACT_ADDRESSES,
      wallet: params.wallet,
      gasPrice: params.gasPrice ?? DEFAULT_GAS_PRICE,
      gasLimitMultiplier:
        params.gasLimitMultiplier ?? DEFAULT_GAS_LIMIT_MULTIPLIER,
    };

    this.indexerApi = new IndexerApi(params.indexerConfig);

    this.providerPromise = Provider.create(params.networkUrl);
  }

  setActiveWallet = (wallet?: WalletLocked | WalletUnlocked) => {
    const newOptions = { ...this.options };
    newOptions.wallet = wallet;
    this.options = newOptions;
  };

  createOrder = async (
    order: CreateOrderParams,
  ): Promise<WriteTransactionResponse> => {
    return this.write.createOrder(order, this.getApiOptions());
  };

  cancelOrder = async (orderId: string): Promise<WriteTransactionResponse> => {
    return this.write.cancelOrder(orderId, this.getApiOptions());
  };

  matchOrders = async (
    sellOrderId: string,
    buyOrderId: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.matchOrders(
      sellOrderId,
      buyOrderId,
      this.getApiOptions(),
    );
  };

  fulfillOrderMany = async (
    order: FulfillOrderManyParams,
  ): Promise<WriteTransactionResponse> => {
    return this.write.fulfillOrderMany(order, this.getApiOptions());
  };

  mintToken = async (
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.mintToken(token, amount, this.getApiOptions());
  };

  deposit = async (
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.deposit(token, amount, this.getApiOptions());
  };

  withdraw = async (
    amount: string,
    assetType: AssetType,
  ): Promise<WriteTransactionResponse> => {
    return this.write.withdraw(amount, assetType, this.getApiOptions());
  };

  /**
   * Not working! All data is hardcoded
   * TODO: FIX IT
   */
  fetchMarkets = async (limit: number): Promise<MarketCreateEvent[]> => {
    // return this.indexerApi.getMarketCreateEvents();
    return [
      {
        id: "1",
        assetId:
          "0xccceae45a7c23dcd4024f4083e959a0686a191694e76fa4fb76c449361ca01f7",
        decimal: 9,
      },
    ];
  };

  fetchMarketPrice = async (baseToken: Asset): Promise<BN> => {
    return this.read.fetchMarketPrice(baseToken.address);
  };

  fetchOrders = async (
    params: GetOrdersParams,
  ): Promise<ApolloQueryResult<{ Order: Order[] }>> => {
    return this.indexerApi.getOrders(params);
  };

  fetchActiveOrders = async <T extends OrderType>(
    params: GetActiveOrdersParams,
  ): Promise<ApolloQueryResult<ActiveOrderReturn<T>>> => {
    return this.indexerApi.getActiveOrders<T>(params);
  };

  subscribeOrders = (
    params: GetOrdersParams,
  ): Observable<FetchResult<{ Order: Order[] }>> => {
    return this.indexerApi.subscribeOrders(params);
  };

  subscribeActiveOrders = <T extends OrderType>(
    params: GetActiveOrdersParams,
  ): Observable<FetchResult<ActiveOrderReturn<T>>> => {
    return this.indexerApi.subscribeActiveOrders<T>(params);
  };

  subscribeTradeOrderEvents = (
    params: GetTradeOrderEventsParams,
  ): Observable<FetchResult<{ TradeOrderEvent: TradeOrderEvent[] }>> => {
    return this.indexerApi.subscribeTradeOrderEvents(params);
  };

  fetchVolume = async (): Promise<Volume> => {
    return this.indexerApi.getVolume();
  };

  fetchOrderById = async (
    orderId: string,
  ): Promise<SpotOrderWithoutTimestamp | undefined> => {
    const options = await this.getFetchOptions();

    return this.read.fetchOrderById(orderId, options);
  };

  fetchWalletBalance = async (asset: Asset): Promise<string> => {
    // We use getApiOptions because we need the user's wallet
    return this.read.fetchWalletBalance(asset.address, this.getApiOptions());
  };

  fetchOrderIdsByAddress = async (trader: Bech32Address): Promise<string[]> => {
    const options = await this.getFetchOptions();

    return this.read.fetchOrderIdsByAddress(trader, options);
  };

  fetchUserMarketBalance = async (
    trader: Bech32Address,
  ): Promise<UserMarketBalance> => {
    const options = await this.getFetchOptions();

    return this.read.fetchUserMarketBalance(trader, options);
  };

  fetchMatcherFee = async () => {
    const options = await this.getFetchOptions();

    return this.read.fetchMatcherFee(options);
  };

  fetchProtocolFee = async () => {
    const options = await this.getFetchOptions();

    return this.read.fetchProtocolFee(options);
  };

  fetchProtocolFeeForAmount = async (amount: string, assetType: AssetType) => {
    const options = await this.getFetchOptions();

    return this.read.fetchProtocolFeeForAmount(amount, assetType, options);
  };

  getProviderWallet = async () => {
    const provider = await this.providerPromise;
    return Wallet.generate({ provider });
  };

  getProvider = async () => {
    return this.providerPromise;
  };

  private getFetchOptions = async (): Promise<Options> => {
    const providerWallet = await this.getProviderWallet();
    const options: Options = { ...this.options, wallet: providerWallet };

    return options;
  };

  private getApiOptions = (): Options => {
    if (!this.options.wallet) {
      throw new NetworkError(NETWORK_ERROR.UNKNOWN_WALLET);
    }

    return this.options as Options;
  };
}
