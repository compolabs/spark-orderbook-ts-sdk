import {
  AccountErrorInput,
  AssetErrorInput,
  AuthErrorInput,
  MatchErrorInput,
  OrderErrorInput,
  ValueErrorInput,
} from "src/types/market/SparkMarket";

type HumanReadableMessages = {
  [K in keyof AccountErrorInput]: string;
} & {
  [K in keyof Required<OrderErrorInput>]: string;
} & {
  [K in keyof Required<MatchErrorInput>]: string;
} & {
  [K in keyof typeof AssetErrorInput]: string;
} & {
  [K in keyof typeof AuthErrorInput]: string;
} & {
  [K in keyof Required<ValueErrorInput>]: string;
};

const humanReadableMessages: HumanReadableMessages = {
  InsufficientBalance: "Insufficient balance",
  InvalidAsset: "The asset provided is invalid",
  InvalidFeeAsset: "The fee asset provided is invalid",
  Unauthorized: "You are not authorized to perform this action",
  CantMatch: "Can't match",
  CantMatchMany: "Cannot match many",
  CantFulfillMany: "Cannot fulfill many",
  CantFulfillFOK: "Cannot fulfill FOK",
  OrderNotFound: "Order was not found",
  OrderDuplicate: "Order is duplicate",
  PriceTooSmall: "The price is too small",
  FailedToRemove: "Failed to remove order",
  InvalidAmount: "Invalid amount provided",
  InvalidSlippage: "Invalid slippage provided",
  InvalidArrayLength: "Invalid array length",
  InvalidFeeAmount: "Fee is too low",
  InvalidEpoch: "Invalid epoch value",
  InvalidFeeSorting: "Invalid fee sorting",
  InvalidFeeZeroBased: "Fee value should be zero-based",
  InvalidValueSame: "Values should not be the same",
  ZeroLockAmount: "Lock amount cannot be zero",
  ZeroTransferAmount: "Transfer amount cannot be zero",
  ZeroUnlockAmount: "Unlock amount cannot be zero",
  InvalidMarketAsset: "Invalid market asset",
  InvalidMarketSame: "Invalid market asset same",
  OrderSizeTooSmall: "Order size too small",
};

const humanReadableMessagesKeys = Object.keys(humanReadableMessages);

export const getHumanReadableError = <K extends keyof HumanReadableMessages>(
  error: string[],
): string => {
  const errorType = error.find((k) => {
    if (typeof k === "object") return;
    return humanReadableMessagesKeys.includes(k);
  }) as K;

  if (!errorType) return "";

  return humanReadableMessages[errorType];
};
