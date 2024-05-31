import { OrderbookContracts } from "src/interface";

export const DEFAULT_DECIMALS = 9;

export const DEFAULT_GAS_PRICE = "1";
export const DEFAULT_GAS_LIMIT_MULTIPLIER = "2";

export const BETA_CONTRACT_ADDRESSES: OrderbookContracts = {
  spotMarket:
    "0x4a2ce054e3e94155f7092f7365b212f7f45105b74819c623744ebcc5d065c6ac",
  tokenFactory:
    "0x3141a3f11e3f784364d57860e3a4dcf9b73d42e23fd49038773cefb09c633348",
  pyth: "0x3cd5005f23321c8ae0ccfa98fb07d9a5ff325c483f21d2d9540d6897007600c9",
};

export const EXPLORER_URL = "https://app.fuel.network/";

export const BETA_NETWORK = {
  name: "Fuel",
  url: "https://testnet.fuel.network/v1/graphql",
};

export const BETA_INDEXER_URL = "https://indexer.spark-defi.com";

export const ENVIO_INDEXER_URL =
  "https://indexer.bigdevenergy.link/67b693c/v1/graphql";
