import { OrderbookContracts } from "src/interface";

export const DEFAULT_DECIMALS = 9;

export const DEFAULT_GAS_PRICE = "1";
export const DEFAULT_GAS_LIMIT_MULTIPLIER = "2";

export const BETA_CONTRACT_ADDRESSES: OrderbookContracts = {
  spotMarket:
    "0x0f0c1065a7b82d026069c5cf070b21ee65713fd1ac92ec1d25eacc3100187f78",
  tokenFactory:
    "0x6bd9643c9279204b474a778dea7f923226060cb94a4c61c5aae015cf96b5aad2",
  pyth: "0x3cd5005f23321c8ae0ccfa98fb07d9a5ff325c483f21d2d9540d6897007600c9",
};

export const EXPLORER_URL = "https://app.fuel.network/";

export const BETA_NETWORK = {
  name: "Fuel",
  url: "https://beta-5.fuel.network/graphql",
};

export const BETA_INDEXER_URL = "https://indexer.spark-defi.com";

export const ENVIO_INDEXER_URL =
  "https://indexer.bigdevenergy.link/8dcea06/v1/graphql";
