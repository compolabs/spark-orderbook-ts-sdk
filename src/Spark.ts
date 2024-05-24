import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import {
  arrayify,
  Provider,
  Wallet,
  WalletLocked,
  WalletUnlocked,
} from "fuels";

import { PythContractAbi__factory } from "./types/pyth";
import BN from "./utils/BN";
import { NETWORK_ERROR, NetworkError } from "./utils/NetworkError";
import {
  BETA_CONTRACT_ADDRESSES,
  DEFAULT_GAS_LIMIT_MULTIPLIER,
  DEFAULT_GAS_PRICE,
} from "./constants";
import {
  Asset,
  FetchOrdersParams,
  FetchTradesParams,
  MarketCreateEvent,
  Options,
  OptionsSpark,
  PerpAllTraderPosition,
  PerpMarket,
  PerpMaxAbsPositionSize,
  PerpPendingFundingPayment,
  PerpTrades,
  SparkParams,
  SpotMarketVolume,
  SpotOrder,
  SpotOrderWithoutTimestamp,
  SpotTrades,
  WriteTransactionResponse,
} from "./interface";
import { ReadActions } from "./ReadActions";
import { WriteActions } from "./WriteActions";

const PYTH_URL = "https://hermes.pyth.network";

export class Spark {
  private write = new WriteActions();

  private read: ReadActions;

  private providerPromise: Promise<Provider>;
  private options: OptionsSpark;
  private pythServiceConnection: EvmPriceServiceConnection;

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

    this.pythServiceConnection = new EvmPriceServiceConnection(
      params.pythUrl ?? PYTH_URL,
      {
        logger: {
          error: console.error,
          warn: console.warn,
          info: () => undefined,
          debug: () => undefined,
          trace: () => undefined,
        },
      },
    );
  }

  setActiveWallet = (wallet?: WalletLocked | WalletUnlocked) => {
    const newOptions = { ...this.options };
    newOptions.wallet = wallet;
    this.options = newOptions;
  };

  createSpotOrder = async (
    baseToken: Asset,
    quoteToken: Asset,
    size: string,
    price: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.spot.createSpotOrder(
      baseToken,
      quoteToken,
      size,
      price,
      this.getApiOptions(),
    );
  };

  cancelSpotOrder = async (
    orderId: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.spot.cancelSpotOrder(orderId, this.getApiOptions());
  };

  matchSpotOrders = async (
    sellOrderId: string,
    buyOrderId: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.spot.matchSpotOrders(
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

  depositPerpCollateral = async (
    asset: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.perp.depositPerpCollateral(
      asset.address,
      amount,
      this.getApiOptions(),
    );
  };

  withdrawPerpCollateral = async (
    baseToken: Asset,
    gasToken: Asset,
    amount: string,
    tokenPriceFeed: string,
  ): Promise<WriteTransactionResponse> => {
    const { priceUpdateData, updateFee } =
      await this.getPriceFeedUpdateData(tokenPriceFeed);

    return this.write.perp.withdrawPerpCollateral(
      baseToken.address,
      gasToken.address,
      amount,
      priceUpdateData,
      updateFee as BN,
      this.getApiOptions(),
    );
  };

  openPerpOrder = async (
    baseToken: Asset,
    gasToken: Asset,
    amount: string,
    price: string,
    tokenPriceFeed: string,
  ): Promise<WriteTransactionResponse> => {
    const { priceUpdateData, updateFee } =
      await this.getPriceFeedUpdateData(tokenPriceFeed);
    return this.write.perp.openPerpOrder(
      baseToken.address,
      gasToken.address,
      amount,
      price,
      priceUpdateData,
      updateFee as BN,
      this.getApiOptions(),
    );
  };

  removePerpOrder = async (
    assetId: string,
  ): Promise<WriteTransactionResponse> => {
    return this.write.perp.removePerpOrder(assetId, this.getApiOptions());
  };

  fulfillPerpOrder = async (
    gasToken: Asset,
    orderId: string,
    amount: string,
    tokenPriceFeed: string,
  ): Promise<WriteTransactionResponse> => {
    const { priceUpdateData, updateFee } =
      await this.getPriceFeedUpdateData(tokenPriceFeed);

    return this.write.perp.fulfillPerpOrder(
      gasToken.address,
      orderId,
      amount,
      priceUpdateData,
      updateFee as BN,
      this.getApiOptions(),
    );
  };

  fetchSpotMarkets = async (limit: number): Promise<MarketCreateEvent[]> => {
    return this.read.spot.fetchSpotMarkets(limit);
  };

  fetchSpotMarketPrice = async (baseToken: Asset): Promise<BN> => {
    return this.read.spot.fetchSpotMarketPrice(baseToken.address);
  };

  fetchSpotOrders = async (params: FetchOrdersParams): Promise<SpotOrder[]> => {
    return this.read.spot.fetchSpotOrders(params);
  };

  fetchSpotTrades = async (
    params: FetchTradesParams,
  ): Promise<SpotTrades[]> => {
    return this.read.spot.fetchSpotTrades(params);
  };

  fetchSpotVolume = async (): Promise<SpotMarketVolume> => {
    return this.read.spot.fetchSpotVolume();
  };

  fetchSpotOrderById = async (
    orderId: string,
  ): Promise<SpotOrderWithoutTimestamp | undefined> => {
    const options = await this.getFetchOptions();

    return this.read.spot.fetchSpotOrderById(orderId, options);
  };

  fetchPerpTrades = async (
    params: FetchTradesParams,
  ): Promise<PerpTrades[]> => {
    return this.read.perp.fetchPerpTradeEvents(params);
  };

  fetchPerpCollateralBalance = async (
    accountAddress: string,
    asset: Asset,
  ): Promise<BN> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpCollateralBalance(
      accountAddress,
      asset.address,
      options,
    );
  };

  fetchPerpAllTraderPositions = async (
    accountAddress: string,
    assetAddress: string,
    limit: number,
  ): Promise<PerpAllTraderPosition[]> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpAllTraderPositions(
      accountAddress,
      assetAddress,
      limit,
      options,
    );
  };

  fetchPerpIsAllowedCollateral = async (asset: Asset): Promise<boolean> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpIsAllowedCollateral(asset.address, options);
  };

  fetchPerpTraderOrders = async (
    accountAddress: string,
    asset: Asset,
    isOpened?: boolean,
    orderType?: "buy" | "sell",
  ) => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpTraderOrders(
      accountAddress,
      asset.address,
      options,
      isOpened,
      orderType,
    );
  };

  fetchPerpAllMarkets = async (
    assetList: Asset[],
    quoteAsset: Asset,
  ): Promise<PerpMarket[]> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpAllMarkets(assetList, quoteAsset, options);
  };

  fetchPerpFundingRate = async (asset: Asset): Promise<BN> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpFundingRate(asset.address, options);
  };

  fetchPerpMaxAbsPositionSize = async (
    accountAddress: string,
    asset: Asset,
    tradePrice: string,
  ): Promise<PerpMaxAbsPositionSize> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpMaxAbsPositionSize(
      accountAddress,
      asset.address,
      tradePrice,
      options,
    );
  };

  matchPerpOrders = async (
    order1Id: string,
    order2Id: string,
  ): Promise<WriteTransactionResponse> => {
    const options = await this.getFetchOptions();
    return this.write.perp.matchPerpOrders(order1Id, order2Id, options);
  };

  fetchPerpPendingFundingPayment = async (
    accountAddress: string,
    asset: Asset,
  ): Promise<PerpPendingFundingPayment> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpPendingFundingPayment(
      accountAddress,
      asset.address,
      options,
    );
  };

  fetchPerpMarkPrice = async (asset: Asset): Promise<BN> => {
    const options = await this.getFetchOptions();

    return this.read.perp.fetchPerpMarkPrice(asset.address, options);
  };

  fetchWalletBalance = async (asset: Asset): Promise<string> => {
    // We use getApiOptions because we need the user's wallet
    return this.read.fetchWalletBalance(asset.address, this.getApiOptions());
  };

  getProviderWallet = async () => {
    const provider = await this.providerPromise;
    return Wallet.generate({ provider });
  };

  getProvider = async () => {
    return this.providerPromise;
  };

  // Lend market functions

  fetchUserSupplyBorrow = async (accountAddress: string) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchUserSupplyBorrow(accountAddress, options);
  };

  fetchCollateralConfigurations = async () => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchCollateralConfigurations(options);
  };

  fetchTotalsCollateral = async (asset: Asset) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchTotalsCollateral(asset.address, options);
  };

  fetchBalanceOfAsset = async (asset: Asset) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchBalanceOfAsset(asset.address, options);
  };

  fetchReserves = async (asset: Asset) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchReserves(options);
  };

  fetchUserCollateral = async (accountAddress: string, asset: Asset) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchUserCollateral(
      accountAddress,
      asset.address,
      options,
    );
  };

  fetchUtilization = async () => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchUtilization(options);
  };

  fetchAvailableToBorrow = async (accountAddress: string) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchAvailableToBorrow(accountAddress, options);
  };

  fetchBorrowRate = async (value: string) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchBorrowRate(value, options);
  };

  fetchSupplyRate = async (value: string) => {
    const options = await this.getFetchOptions();

    return this.read.lend.fetchSupplyRate(value, options);
  };

  supplyBase = async (gasToken: Asset, amount: string, asset: Asset) => {
    return this.write.lend.supplyBase(
      gasToken.address,
      amount,
      asset.address,
      this.getApiOptions(),
    );
  };

  withdrawBase = async (gasToken: Asset, amount: string) => {
    return this.write.lend.withdrawBase(
      gasToken.address,
      amount,
      this.getApiOptions(),
    );
  };

  supplyCollateral = async (gasToken: Asset) => {
    return this.write.lend.supplyCollateral(
      gasToken.address,
      this.getApiOptions(),
    );
  };

  withdrawCollateral = async (
    gasToken: Asset,
    amount: string,
    asset: Asset,
  ) => {
    return this.write.lend.withdrawCollateral(
      gasToken.address,
      amount,
      asset.address,
      this.getApiOptions(),
    );
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

  private getPriceFeedUpdateData = async (
    feedIds: string | string[],
  ): Promise<{
    priceUpdateData: number[][];
    updateFee: unknown;
  }> => {
    const options = await this.getFetchOptions();

    const pythContract = PythContractAbi__factory.connect(
      options.contractAddresses.pyth,
      options.wallet,
    );

    const priceUpdateData =
      await this.pythServiceConnection.getPriceFeedsUpdateData(
        [feedIds].flat(),
      );

    const parsedUpdateData = priceUpdateData.map((v) =>
      Array.from(arrayify(v)),
    );

    const updateFee = await pythContract.functions
      .update_fee(parsedUpdateData)
      .get();

    return {
      priceUpdateData: parsedUpdateData,
      updateFee: updateFee.value,
    };
  };
}
