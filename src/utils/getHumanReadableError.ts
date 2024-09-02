import {
  AccountErrorInput,
  AssetErrorInput,
  AuthErrorInput,
  MatchErrorInput,
  OrderErrorInput,
  ValueErrorInput,
} from "src/types/market/MarketContractAbi";

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
  OrderNotFound: "Order was not found",
  PriceTooSmall: "The price is too small",
  ZeroOrderAmount: "Order amount cannot be zero",
  ZeroLockAmount: "Lock amount cannot be zero",
  FailedToRemove: "Failed to remove order",
  InvalidAmount: "Invalid amount provided",
  InvalidSlippage: "Invalid slippage provided",
  InvalidArrayLength: "Invalid array length",
  InvalidFeeAmount: "Fee is too low",
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
