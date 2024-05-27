import { Contracts } from "src/interface";

export const DEFAULT_DECIMALS = 9;

export const DEFAULT_GAS_PRICE = "1";
export const DEFAULT_GAS_LIMIT_MULTIPLIER = "2";

type FuelAddress = `fuel${string}`;
type EthereumAddress = `0x${string}`;

type ContractAddress = {
  base: EthereumAddress;
  fuel: FuelAddress;
};

export const BETA_CONTRACT_ADDRESSES: Contracts = {
  spotMarket:
    "0x0f0c1065a7b82d026069c5cf070b21ee65713fd1ac92ec1d25eacc3100187f78",
  tokenFactory:
    "0x6bd9643c9279204b474a778dea7f923226060cb94a4c61c5aae015cf96b5aad2",
  pyth: "0x3cd5005f23321c8ae0ccfa98fb07d9a5ff325c483f21d2d9540d6897007600c9",

  // repo spark-perps
  vault: "0x3629d6eb42b80d27d434253c9bb710d62417d686826627c4a981e81676608ef5",
  accountBalance:
    "0x4bdb37b10982b5cf77845bf44095b8036cf9252386dd2e0037bcdbb1a8499b51",
  clearingHouse:
    "0xfc748b3c1e9ee8adbedecef7b9aac906b7659bafc0fd198629010197f169e3d2",
  perpMarket:
    "0x9d3ac2d8201ec152d4b6953dbf3036464a8aa2ba70be021cf6f905d2358ecc65",
  proxy: "0x51d66411f4a1b38fe67f53993e82ed6448d6097a755506c94fe21711c68dc94a",
  insuranceFund:
    "0x2a6c2283b226405fcb80133bdea7a5b43532409e4f8550c51e22fc327a402939",

  // repo swaylend-contracts
  lendMarket:
    "0x974cb7510dd28335dccdff984660d0da9efd0fbb3988c113189c1fe9158d40c0",
};

export const EXPLORER_URL = "https://app.fuel.network/";

export const BETA_NETWORK = {
  name: "Fuel",
  url: "https://beta-5.fuel.network/graphql",
};

export const BETA_INDEXER_URL = "https://indexer.spark-defi.com";

export const ENVIO_INDEXER_URL = "http://13.49.144.58:8080/v1/graphql";
