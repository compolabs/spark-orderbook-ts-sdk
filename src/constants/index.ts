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
  vault: "0x9a8a7f725cb91f9a8150c176211a328ff4686084deb74f898f63abe172d6f4f9",
  accountBalance:
    "0x0d80c8554940954cc2a18589e2b4cc907f0cd59ad17a4cd0bfb9a7ebcc16f087",
  clearingHouse:
    "0x0cb56bf48312492663216e847e39bae2e1f7f2f778c5730c9a57f101c020f7d7",
  perpMarket:
    "0x2a4e482664b9c63483d2899601d8a4500e44e401e38a4545b1a932de5c85832f",
  proxy: "0x14aa6060dfff1cf3977a57b414e1dd6b413181b33c4cbd888f5eadf1d0481a9e",
  insuranceFund:
    "0xa067eef9358eb402b05a744b9cbec475b5eb3596b3c87daa1647294423bdd0fb",

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

export const ENVIO_INDEXER_URL =
  "https://indexer.bigdevenergy.link/8dcea06/v1/graphql";
