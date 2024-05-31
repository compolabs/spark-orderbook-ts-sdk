import { Address } from "fuels";

import { OrderbookAbi__factory } from "./types/orderbook";
import BN from "./utils/BN";
import { convertI64ToBn } from "./utils/convertI64ToBn";
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

  fetchSpotMarkets = async (limit: number): Promise<MarketCreateEvent[]> => {
    const data = await this.indexerApi.getSpotMarketCreateEvents();

    const markets = data.map((market) => ({
      id: market.asset_id,
      assetId: market.asset_id,
      decimal: Number(market.asset_decimals),
    }));

    return markets;
  };

  fetchSpotMarketPrice = async (baseToken: string): Promise<BN> => {
    console.warn("[fetchMarketPrice] NOT IMPLEMENTED FOR FUEL");
    return BN.ZERO;
  };

  fetchSpotOrders = async ({
    baseToken,
    type,
    limit,
    trader,
    isActive,
  }: FetchOrdersParams): Promise<SpotOrder[]> => {
    const traderAddress = trader
      ? new Address(trader as any).toB256()
      : undefined;

    const data = await this.indexerApi.getSpotOrders({
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

  fetchSpotTrades = async ({
    baseToken,
    limit,
    trader,
  }: FetchTradesParams): Promise<SpotTrades[]> => {
    const traderAddress = trader
      ? new Address(trader as any).toB256()
      : undefined;

    const data = await this.indexerApi.getSpotTradeEvents({
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

  fetchSpotVolume = async (): Promise<SpotMarketVolume> => {
    const data = await this.indexerApi.getSpotVolume();
    return {
      volume: new BN(data.volume24h),
      high: new BN(data.high24h),
      low: new BN(data.low24h),
    };
  };

  fetchSpotOrderById = async (
    orderId: string,
    options: Options,
  ): Promise<SpotOrderWithoutTimestamp | undefined> => {
    const orderbookFactory = OrderbookAbi__factory.connect(
      options.contractAddresses.spotMarket,
      options.wallet,
    );

    const result = await orderbookFactory.functions.order_by_id(orderId).get();

    if (!result.value) return undefined;

    const baseSize = convertI64ToBn(result.value.base_size);
    const basePrice = new BN(result.value.base_price.toString());
    return {
      id: result.value?.id,
      baseToken: result.value.base_token.bits,
      trader: result.value.trader.bits,
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
