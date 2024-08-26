import {
  AccountErrorInput,
  AssetErrorInput,
  AuthErrorInput,
  MatchErrorInput,
  OrderErrorInput,
  ValueErrorInput,
} from "src/types/market/MarketContractAbi";

type EnsureArray<T> = T extends any[] ? T : [T];

type HumanReadableMessages = {
  [K in keyof AccountErrorInput]: (args: AccountErrorInput[K]) => string;
} & {
  [K in keyof Required<OrderErrorInput>]: (
    args: EnsureArray<OrderErrorInput[K]>,
  ) => string;
} & {
  [K in keyof Required<MatchErrorInput>]: (
    args: EnsureArray<MatchErrorInput[K]>,
  ) => string;
} & {
  [K in keyof typeof AssetErrorInput]: () => string;
} & {
  [K in keyof typeof AuthErrorInput]: () => string;
} & {
  [K in keyof Required<ValueErrorInput>]: (
    args: EnsureArray<ValueErrorInput[K]>,
  ) => string;
};

const humanReadableMessages: HumanReadableMessages = {
  InsufficientBalance: () => `Insufficient balance`,
  InvalidAsset: () => `The asset provided is invalid`,
  InvalidFeeAsset: () => `The fee asset provided is invalid`,
  Unauthorized: () => `You are not authorized to perform this action`,
  CantMatch: () => `Can't match`,
  CantMatchMany: () => `Cannot match many`,
  CantFulfillMany: () => `Cannot fulfill many`,
  OrderNotFound: (args) => `Order with ID ${args[0]} was not found`,
  PriceTooSmall: () => `The price is too small`,
  ZeroOrderAmount: () => `Order amount cannot be zero`,
  ZeroLockAmount: () => `Lock amount cannot be zero`,
  FailedToRemove: (args) => `Failed to remove order with ID ${args[0]}`,
  InvalidAmount: () => `Invalid amount provided`,
  InvalidSlippage: () => `Invalid slippage provided`,
  InvalidArrayLength: () => `Invalid array length`,
  InvalidFeeAmount: () => `Fee is too low`,
};

export const getHumanReadableError = <K extends keyof HumanReadableMessages>(
  error: Record<K, any[]>,
): string => {
  const errorType = Object.keys(error)[0] as K;
  const args = error[errorType] ?? [];
  const msgFn = humanReadableMessages[errorType]! as unknown as (
    args: any[],
  ) => string;

  return msgFn(args) ?? "";
};
