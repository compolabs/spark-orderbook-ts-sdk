import { OrderbookContracts } from "src/interface";

export const DEFAULT_DECIMALS = 9;

export const DEFAULT_GAS_PRICE = "1";
export const DEFAULT_GAS_LIMIT_MULTIPLIER = "2";

export const BETA_CONTRACT_ADDRESSES: OrderbookContracts = {
  market: "0x1b01206d39aa298c8d8373c23b6a2c07cda5be0a142cc642518fd8d9d6bbfc7f",
  tokenFactory:
    "0x3141a3f11e3f784364d57860e3a4dcf9b73d42e23fd49038773cefb09c633348",
  pyth: "0x3cd5005f23321c8ae0ccfa98fb07d9a5ff325c483f21d2d9540d6897007600c9",
};

export const EXPLORER_URL = "https://app.fuel.network/";

export const TESTNET_NETWORK = {
  name: "Fuel",
  url: "https://testnet.fuel.network/v1/graphql",
};

export const TESTNET_INDEXER_URL =
  "https://indexer.bigdevenergy.link/67b693c/v1/graphql";
