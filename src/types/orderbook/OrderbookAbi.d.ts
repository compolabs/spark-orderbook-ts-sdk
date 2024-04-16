/* Autogenerated file. Do not edit manually. */

/* tslint:disable */
/* eslint-disable */

/*
  Fuels version: 0.77.0
  Forc version: 0.51.1
  Fuel-Core version: 0.22.1
*/

import type {
  BigNumberish,
  BN,
  BytesLike,
  Contract,
  DecodedValue,
  FunctionFragment,
  Interface,
  InvokeFunction,
} from 'fuels';

import type { Option, Enum, Vec } from "./common";

export enum ErrorInput { AccessDenied = 'AccessDenied', NoOrdersFound = 'NoOrdersFound', NoMarketFound = 'NoMarketFound', OrdersCantBeMatched = 'OrdersCantBeMatched', FirstArgumentShouldBeOrderSellSecondOrderBuy = 'FirstArgumentShouldBeOrderSellSecondOrderBuy', ZeroAssetAmountToSend = 'ZeroAssetAmountToSend', MarketAlreadyExists = 'MarketAlreadyExists', BadAsset = 'BadAsset', BadValue = 'BadValue', BadPrice = 'BadPrice' };
export enum ErrorOutput { AccessDenied = 'AccessDenied', NoOrdersFound = 'NoOrdersFound', NoMarketFound = 'NoMarketFound', OrdersCantBeMatched = 'OrdersCantBeMatched', FirstArgumentShouldBeOrderSellSecondOrderBuy = 'FirstArgumentShouldBeOrderSellSecondOrderBuy', ZeroAssetAmountToSend = 'ZeroAssetAmountToSend', MarketAlreadyExists = 'MarketAlreadyExists', BadAsset = 'BadAsset', BadValue = 'BadValue', BadPrice = 'BadPrice' };
export enum ReentrancyErrorInput { NonReentrant = 'NonReentrant' };
export enum ReentrancyErrorOutput { NonReentrant = 'NonReentrant' };

export type AddressInput = { value: string };
export type AddressOutput = AddressInput;
export type AssetIdInput = { value: string };
export type AssetIdOutput = AssetIdInput;
export type I64Input = { value: BigNumberish, negative: boolean };
export type I64Output = { value: BN, negative: boolean };
export type MarketInput = { asset_id: AssetIdInput, asset_decimals: BigNumberish };
export type MarketOutput = { asset_id: AssetIdOutput, asset_decimals: number };
export type MarketCreateEventInput = { asset_id: AssetIdInput, asset_decimals: BigNumberish, timestamp: BigNumberish };
export type MarketCreateEventOutput = { asset_id: AssetIdOutput, asset_decimals: number, timestamp: BN };
export type OrderInput = { id: string, trader: AddressInput, base_token: AssetIdInput, base_size: I64Input, base_price: BigNumberish };
export type OrderOutput = { id: string, trader: AddressOutput, base_token: AssetIdOutput, base_size: I64Output, base_price: BN };
export type OrderChangeEventInput = { order_id: string, trader: AddressInput, base_token: AssetIdInput, base_size_change: I64Input, base_price: BigNumberish, timestamp: BigNumberish };
export type OrderChangeEventOutput = { order_id: string, trader: AddressOutput, base_token: AssetIdOutput, base_size_change: I64Output, base_price: BN, timestamp: BN };
export type TradeEventInput = { base_token: AssetIdInput, order_matcher: AddressInput, seller: AddressInput, buyer: AddressInput, trade_size: BigNumberish, trade_price: BigNumberish, sell_order_id: string, buy_order_id: string, timestamp: BigNumberish };
export type TradeEventOutput = { base_token: AssetIdOutput, order_matcher: AddressOutput, seller: AddressOutput, buyer: AddressOutput, trade_size: BN, trade_price: BN, sell_order_id: string, buy_order_id: string, timestamp: BN };

export type OrderbookAbiConfigurables = {
  QUOTE_TOKEN: AssetIdInput;
  QUOTE_TOKEN_DECIMALS: BigNumberish;
  PRICE_DECIMALS: BigNumberish;
};

interface OrderbookAbiInterface extends Interface {
  functions: {
    cancel_order: FunctionFragment;
    create_market: FunctionFragment;
    get_configurables: FunctionFragment;
    get_market_by_id: FunctionFragment;
    market_exists: FunctionFragment;
    match_orders: FunctionFragment;
    open_order: FunctionFragment;
    order_by_id: FunctionFragment;
    orders_by_trader: FunctionFragment;
  };

  encodeFunctionData(functionFragment: 'cancel_order', values: [string]): Uint8Array;
  encodeFunctionData(functionFragment: 'create_market', values: [AssetIdInput, BigNumberish]): Uint8Array;
  encodeFunctionData(functionFragment: 'get_configurables', values: []): Uint8Array;
  encodeFunctionData(functionFragment: 'get_market_by_id', values: [AssetIdInput]): Uint8Array;
  encodeFunctionData(functionFragment: 'market_exists', values: [AssetIdInput]): Uint8Array;
  encodeFunctionData(functionFragment: 'match_orders', values: [string, string]): Uint8Array;
  encodeFunctionData(functionFragment: 'open_order', values: [AssetIdInput, I64Input, BigNumberish]): Uint8Array;
  encodeFunctionData(functionFragment: 'order_by_id', values: [string]): Uint8Array;
  encodeFunctionData(functionFragment: 'orders_by_trader', values: [AddressInput]): Uint8Array;

  decodeFunctionData(functionFragment: 'cancel_order', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'create_market', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'get_configurables', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'get_market_by_id', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'market_exists', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'match_orders', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'open_order', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'order_by_id', data: BytesLike): DecodedValue;
  decodeFunctionData(functionFragment: 'orders_by_trader', data: BytesLike): DecodedValue;
}

export class OrderbookAbi extends Contract {
  interface: OrderbookAbiInterface;
  functions: {
    cancel_order: InvokeFunction<[order_id: string], void>;
    create_market: InvokeFunction<[asset_id: AssetIdInput, asset_decimals: BigNumberish], void>;
    get_configurables: InvokeFunction<[], [AssetIdOutput, number, number]>;
    get_market_by_id: InvokeFunction<[asset_id: AssetIdInput], MarketOutput>;
    market_exists: InvokeFunction<[asset_id: AssetIdInput], boolean>;
    match_orders: InvokeFunction<[order_sell_id: string, order_buy_id: string], void>;
    open_order: InvokeFunction<[base_token: AssetIdInput, base_size: I64Input, base_price: BigNumberish], string>;
    order_by_id: InvokeFunction<[order: string], Option<OrderOutput>>;
    orders_by_trader: InvokeFunction<[trader: AddressInput], Vec<string>>;
  };
}
