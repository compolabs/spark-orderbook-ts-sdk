import { Address } from "fuels";

import { MarketContractAbi__factory } from "./types/market";
import BN from "./utils/BN";
import getUnixTime from "./utils/getUnixTime";
import { IndexerApi } from "./IndexerApi";
import {
  FetchOrdersParams,
  FetchTradesParams,
  MarketCreateEvent,
  Options,
  SpotMarketVolume,
  SpotOrder,
  SpotOrderWithoutTimestamp,
  SpotTrades,
} from "./interface";

export class ReadActions {
  protected indexerApi: IndexerApi;

  constructor(url: string) {
    this.indexerApi = new IndexerApi(url);
  }

  fetchMarkets = async (limit: number): Promise<MarketCreateEvent[]> => {
    const data = await this.indexerApi.getMarketCreateEvents();

    const markets = data.map((market) => ({
      id: market.asset_id,
      assetId: market.asset_id,
      decimal: Number(market.asset_decimals),
    }));

    return markets;
  };

  fetchMarketPrice = async (baseToken: string): Promise<BN> => {
    console.warn("[fetchMarketPrice] NOT IMPLEMENTED FOR FUEL");
    return BN.ZERO;
  };

  fetchOrders = async ({
    baseToken,
    type,
    limit,
    trader,
    isActive,
  }: FetchOrdersParams): Promise<SpotOrder[]> => {
    const traderAddress = trader
      ? new Address(trader as any).toB256()
      : undefined;

    const data = await this.indexerApi.getOrders({
      baseToken,
      orderType: type,
      limit,
      trader: traderAddress,
      isOpened: isActive,
    });

    const orders = data.map((order) => {
      const baseSize = new BN(order.base_size);
      const basePrice = new BN(order.base_price);
      return {
        id: order.id,
        baseToken: order.base_token,
        trader: order.trader,
        baseSize,
        orderPrice: basePrice,
        blockTimestamp: getUnixTime(order.timestamp),
      };
    });

    return orders;
  };

  fetchTrades = async ({
    baseToken,
    limit,
    trader,
  }: FetchTradesParams): Promise<SpotTrades[]> => {
    const traderAddress = trader
      ? new Address(trader as any).toB256()
      : undefined;

    const data = await this.indexerApi.getTradeEvents({
      limit,
      trader: traderAddress,
      baseToken,
    });

    return data.map((trade) => ({
      baseToken: trade.base_token,
      buyer: trade.buyer,
      id: String(trade.id),
      matcher: trade.order_matcher,
      seller: trade.seller,
      tradeAmount: new BN(trade.trade_size),
      price: new BN(trade.trade_price),
      timestamp: getUnixTime(trade.timestamp),
    }));
  };

  fetchVolume = async (): Promise<SpotMarketVolume> => {
    const data = await this.indexerApi.getVolume();
    return {
      volume: new BN(data.volume24h),
      high: new BN(data.high24h),
      low: new BN(data.low24h),
    };
  };

  fetchOrderById = async (
    orderId: string,
    options: Options,
  ): Promise<SpotOrderWithoutTimestamp | undefined> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const result = await orderbookFactory.functions.order(orderId).get();

    if (!result.value) return undefined;

    const baseSize = new BN(result.value.amount.toString());
    const basePrice = new BN(result.value.price.toString());
    return {
      // TODO: Check what is ID for order
      // id: result.value?.id,
      id: "",
      baseToken: result.value.asset.bits,
      trader: result.value.owner.Address?.bits ?? "", // TODO: Check owner Address or ContractId
      baseSize,
      orderPrice: basePrice,
    };
  };

  fetchWalletBalance = async (
    assetId: string,
    options: Options,
  ): Promise<string> => {
    const balance = await options.wallet.getBalance(assetId);
    return balance.toString();
  };
}
