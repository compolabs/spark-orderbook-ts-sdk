import { Address, Bech32Address, Provider, Wallet, WalletLocked, WalletUnlocked } from "fuels";

import BN from "./utils/BN";
import { NETWORK_ERROR, NetworkError } from "./utils/NetworkError";
import {
  BETA_CONTRACT_ADDRESSES,
  DEFAULT_GAS_LIMIT_MULTIPLIER,
  DEFAULT_GAS_PRICE,
} from "./constants";
import {
  Asset,
  AssetType,
  FetchOrdersParams,
  FetchTradesParams,
  MarketCreateEvent,
  Options,
  OptionsSpark,
  OrderType,
  SparkParams,
  SpotMarketVolume,
  SpotOrder,
  SpotOrderWithoutTimestamp,
  SpotTrades,
  WriteTransactionResponse,
} from "./interface";
import { ReadActions } from "./ReadActions";
import { WriteActions } from "./WriteActions";

export class SparkOrderbook {
  private write = new WriteActions();

  private read: ReadActions;

  private providerPromise: Promise<Provider>;
  private options: OptionsSpark;

  constructor(params: SparkParams) {
    this.options = {
      contractAddresses: params.contractAddresses ?? BETA_CONTRACT_ADDRESSES,
      wallet: params.wallet,
      gasPrice: params.gasPrice ?? DEFAULT_GAS_PRICE,
      gasLimitMultiplier:
        params.gasLimitMultiplier ?? DEFAULT_GAS_LIMIT_MULTIPLIER,
    };

    this.read = new ReadActions(params.indexerApiUrl);

    this.providerPromise = Provider.create(params.networkUrl);
  }

  setActiveWallet = (wallet?: WalletLocked | WalletUnlocked) => {
    const newOptions = { ...this.options };
    newOptions.wallet = wallet;
    this.options = newOptions;
  };

  createOrder = async (
    amount: string,
    token: Asset,
    tokenType: AssetType,
    price: string,
    type: OrderType,
  ): Promise<WriteTransactionResponse> => {
    return this.write.createOrder(
      amount,
      token,
      tokenType,
      price,
      type,
      this.getApiOptions(),
    );
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

  fetchMarkets = async (limit: number): Promise<MarketCreateEvent[]> => {
    return this.read.fetchMarkets(limit);
  };

  fetchMarketPrice = async (baseToken: Asset): Promise<BN> => {
    return this.read.fetchMarketPrice(baseToken.address);
  };

  fetchOrders = async (params: FetchOrdersParams): Promise<SpotOrder[]> => {
    return this.read.fetchOrders(params);
  };

  fetchTrades = async (params: FetchTradesParams): Promise<SpotTrades[]> => {
    return this.read.fetchTrades(params);
  };

  fetchVolume = async (): Promise<SpotMarketVolume> => {
    return this.read.fetchVolume();
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
