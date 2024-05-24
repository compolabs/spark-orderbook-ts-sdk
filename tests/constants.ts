import { BETA_TOKENS } from "../src";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

export const TEST_TIMEOUT = 60_000; // 1min;

export const PRIVATE_KEY_ALICE = process.env.ALICE ?? "";

export const pythURL = "https://hermes.pyth.network";

export interface TokenAsset {
  address: string;
  symbol: string;
  decimals: number;
  priceFeed: string;
}

export const TOKENS_LIST: TokenAsset[] = Object.values(BETA_TOKENS).map(
  ({ decimals, assetId, symbol, priceFeed }) => ({
    address: assetId,
    symbol,
    decimals,
    priceFeed,
  }),
);

export const TOKENS_BY_SYMBOL: Record<string, TokenAsset> = TOKENS_LIST.reduce(
  (acc, t) => ({ ...acc, [t.symbol]: t }),
  {},
);

export const TOKENS_BY_ASSET_ID: Record<string, TokenAsset> =
  TOKENS_LIST.reduce(
    (acc, t) => ({ ...acc, [t.address.toLowerCase()]: t }),
    {},
  );

export const FAUCET_AMOUNTS = {
  ETH: "0.001",
  USDC: "3000",
  BTC: "0.01",
  UNI: "50",
};
