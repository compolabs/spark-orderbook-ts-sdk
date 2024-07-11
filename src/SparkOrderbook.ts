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
  Asset,
  AssetType,
  CreateOrderParams,
  DepositParams,
  GetOrdersParams,
  GetTradeOrderEventsParams,
  MarketCreateEvent,
  Options,
  OptionsSpark,
  Order,
  SparkParams,
  SpotOrderWithoutTimestamp,
  TradeOrderEvent,
  UserMarketBalance,
  Volume,
  WithdrawParams,
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
    deposit: DepositParams,
    order: CreateOrderParams,
  ): Promise<WriteTransactionResponse> => {
    return this.write.createOrder(deposit, order, this.getApiOptions());
  };

  cancelOrder = async (
    withdraw: WithdrawParams,
    orderId: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.cancelOrder(withdraw, orderId, this.getApiOptions());
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
    tokenType: AssetType,
  ): Promise<WriteTransactionResponse> => {
    return this.write.withdraw(amount, tokenType, this.getApiOptions());
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

  fetchOrders = async (params: GetOrdersParams): Promise<Order[]> => {
    return this.indexerApi.getOrders(params);
  };

  getTradeOrderEvents = async (
    params: GetTradeOrderEventsParams,
  ): Promise<TradeOrderEvent[]> => {
    return this.indexerApi.getTradeOrderEvents(params);
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
