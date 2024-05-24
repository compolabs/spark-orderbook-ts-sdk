import { Address } from "fuels";
import {
  Asset,
  FetchTradesParams,
  Options,
  PerpAllTraderPosition,
  PerpMarket,
  PerpMaxAbsPositionSize,
  PerpPendingFundingPayment,
  PerpTraderOrder,
  PerpTrades,
} from "src/interface";
import { ReadActions } from "src/ReadActions";
import { AccountBalanceAbi__factory } from "src/types/account-balance";
import {
  AddressInput,
  AssetIdInput,
} from "src/types/account-balance/AccountBalanceAbi";
import { ClearingHouseAbi__factory } from "src/types/clearing-house";
import { PerpMarketAbi__factory } from "src/types/perp-market";
import { VaultAbi__factory } from "src/types/vault";
import BN from "src/utils/BN";
import { convertI64ToBn } from "src/utils/convertI64ToBn";
import getUnixTime from "src/utils/getUnixTime";

export class PerpReadActions extends ReadActions {
  fetchPerpCollateralBalance = async (
    accountAddress: string,
    assetAddress: string,
    options: Options,
  ): Promise<BN> => {
    const vaultFactory = VaultAbi__factory.connect(
      options.contractAddresses.vault,
      options.wallet,
    );

    const addressInput: AddressInput = {
      value: new Address(accountAddress as any).toB256(),
    };

    const assetIdInput: AssetIdInput = {
      value: assetAddress,
    };

    const result = await vaultFactory.functions
      .get_collateral_balance(addressInput, assetIdInput)
      .get();

    const collateralBalance = new BN(result.value.toString());

    return collateralBalance;
  };

  fetchPerpAllTraderPositions = async (
    accountAddress: string,
    assetAddress: string,
    limit: number,
    options: Options,
  ): Promise<PerpAllTraderPosition[]> => {
    const data = await this.indexerApi.getPerpPositions({
      trader: accountAddress,
      baseToken: assetAddress,
      limit,
    });

    const positions = data.map((position) => ({
      baseTokenAddress: position.base_token,
      lastTwPremiumGrowthGlobal: new BN(position.last_tw_premium_growth_global),
      takerOpenNational: new BN(position.taker_open_notional),
      takerPositionSize: new BN(position.taker_position_size),
    }));

    return positions;
  };

  fetchPerpMarketPrice = async (
    assetAddress: string,
    options: Options,
  ): Promise<BN> => {
    const perpMarketFactory = PerpMarketAbi__factory.connect(
      options.contractAddresses.perpMarket,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: assetAddress,
    };

    const result = await perpMarketFactory.functions
      .get_market_price(assetIdInput)
      .get();

    const marketPrice = new BN(result.value.toString());

    return marketPrice;
  };

  fetchPerpFundingRate = async (
    assetAddress: string,
    options: Options,
  ): Promise<BN> => {
    const accountBalanceFactory = AccountBalanceAbi__factory.connect(
      options.contractAddresses.accountBalance,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: assetAddress,
    };

    const result = await accountBalanceFactory.functions
      .get_funding_rate(assetIdInput)
      .get();

    const fundingRate = convertI64ToBn(result.value);

    return fundingRate;
  };

  fetchPerpFreeCollateral = async (
    accountAddress: string,
    options: Options,
  ): Promise<BN> => {
    const vaultFactory = VaultAbi__factory.connect(
      options.contractAddresses.vault,
      options.wallet,
    );

    const addressInput: AddressInput = {
      value: new Address(accountAddress as any).toB256(),
    };

    const result = await vaultFactory.functions
      .get_free_collateral(addressInput)
      .get();

    const freeCollateral = new BN(result.value.toString());

    return freeCollateral;
  };

  fetchPerpMarket = async (
    baseAsset: Asset,
    quoteAsset: Asset,
    options: Options,
  ): Promise<PerpMarket> => {
    const clearingHouseFactory = ClearingHouseAbi__factory.connect(
      options.contractAddresses.clearingHouse,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: baseAsset.address,
    };

    const result = await clearingHouseFactory.functions
      .get_market(assetIdInput)
      .get();

    const pausedIndexPrice = result.value.paused_index_price
      ? new BN(result.value.paused_index_price.toString())
      : undefined;
    const pausedTimestamp = result.value.paused_timestamp
      ? new BN(result.value.paused_timestamp.toString()).toNumber()
      : undefined;
    const closedPrice = result.value.closed_price
      ? new BN(result.value.closed_price.toString())
      : undefined;

    const perpMarket: PerpMarket = {
      baseTokenAddress: result.value.asset_id.value,
      quoteTokenAddress: quoteAsset.address,
      imRatio: new BN(result.value.im_ratio.toString()),
      mmRatio: new BN(result.value.mm_ratio.toString()),
      status: result.value.status,
      pausedIndexPrice,
      pausedTimestamp,
      closedPrice,
    };

    return perpMarket;
  };

  fetchPerpAllMarkets = async (
    assets: Asset[],
    quoteAsset: Asset,
    options: Options,
  ): Promise<PerpMarket[]> => {
    const data = await this.indexerApi.getPerpMarkets();

    const markets: PerpMarket[] = data.map((market) => ({
      baseTokenAddress: market.asset_id,
      quoteTokenAddress: quoteAsset.address,
      imRatio: new BN(market.im_ratio),
      mmRatio: new BN(market.mm_ratio),
      status: market.status,
      pausedIndexPrice: market.paused_index_price
        ? new BN(market.paused_index_price)
        : undefined,
      pausedTimestamp: Number(market.paused_timestamp),
      closedPrice: market.closed_price
        ? new BN(market.closed_price)
        : undefined,
    }));

    return markets;
  };

  fetchPerpPendingFundingPayment = async (
    accountAddress: string,
    assetAddress: string,
    options: Options,
  ): Promise<PerpPendingFundingPayment> => {
    const accountBalanceFactory = AccountBalanceAbi__factory.connect(
      options.contractAddresses.accountBalance,
      options.wallet,
    );

    const addressInput: AddressInput = {
      value: new Address(accountAddress as any).toB256(),
    };

    const assetIdInput: AssetIdInput = {
      value: assetAddress,
    };

    const result = await accountBalanceFactory.functions
      .get_pending_funding_payment(addressInput, assetIdInput)
      .get();

    const fundingPayment = convertI64ToBn(result.value[0]);
    const fundingGrowthPayment = convertI64ToBn(result.value[1]);

    return { fundingPayment, fundingGrowthPayment };
  };

  fetchPerpIsAllowedCollateral = async (
    assetAddress: string,
    options: Options,
  ): Promise<boolean> => {
    const vaultFactory = VaultAbi__factory.connect(
      options.contractAddresses.vault,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: assetAddress,
    };

    const result = await vaultFactory.functions
      .is_allowed_collateral(assetIdInput)
      .get();

    return result.value;
  };

  fetchPerpTraderOrders = async (
    accountAddress: string,
    assetAddress: string,
    options: Options,
    isOpened?: boolean,
    orderType?: "buy" | "sell",
  ): Promise<PerpTraderOrder[]> => {
    const data = await this.indexerApi.getPerpOrders({
      trader: accountAddress,
      baseToken: assetAddress,
    });

    const orders = data.map((order) => ({
      id: order.id,
      trader: order.trader,
      baseTokenAddress: order.base_token,
      baseSize: new BN(order.base_size),
      orderPrice: new BN(order.base_price),
      timestamp: getUnixTime(order.timestamp),
    }));

    return orders;
  };

  fetchPerpMaxAbsPositionSize = async (
    accountAddress: string,
    assetAddress: string,
    tradePrice: string,
    options: Options,
  ): Promise<PerpMaxAbsPositionSize> => {
    const vaultFactory = VaultAbi__factory.connect(
      options.contractAddresses.vault,
      options.wallet,
    );

    const addressInput: AddressInput = {
      value: new Address(accountAddress as any).toB256(),
    };

    const assetIdInput: AssetIdInput = {
      value: assetAddress,
    };

    const result = await vaultFactory.functions
      .get_max_abs_position_size(addressInput, assetIdInput, tradePrice)
      .get();
    const shortSize = new BN(result.value[0].toString());
    const longSize = new BN(result.value[1].toString());

    return { shortSize, longSize };
  };

  fetchPerpMarkPrice = async (
    assetAddress: string,
    options: Options,
  ): Promise<BN> => {
    const perpMarketFactory = PerpMarketAbi__factory.connect(
      options.contractAddresses.perpMarket,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: assetAddress,
    };

    const result = await perpMarketFactory.functions
      .get_mark_price(assetIdInput)
      .get();

    const markPrice = new BN(result.value.toString());

    return markPrice;
  };

  fetchPerpTradeEvents = async ({
    baseToken,
    limit,
    trader,
  }: FetchTradesParams): Promise<PerpTrades[]> => {
    const traderAddress = trader
      ? new Address(trader as any).toB256()
      : undefined;

    const data = await this.indexerApi.getPerpTradeEvents({
      limit,
      trader: traderAddress,
      baseToken,
    });

    return data.map((trade) => ({
      baseToken: trade.base_token,
      seller: trade.seller,
      buyer: trade.buyer,
      tradeSize: trade.trade_size,
      tradePrice: trade.trade_price,
      sellOrderId: trade.sell_order_id,
      buyOrderId: trade.buy_order_id,
      timestamp: trade.timestamp,
    }));
  };
}
