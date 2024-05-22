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
  vault: "0x60e8310cd9b0cb1455e6574ebb692c4bd7e37c4692234fd9b159cf6a636adfe3",
  accountBalance:
    "0x227d7dd191158406e1954310e7f6ea2a128ca8ca3134cbcd87054baf686aadee",
  clearingHouse:
    "0x631c7c0bbf3c2e75214f8cf8db8459f95062d04cde982a6e66a561efa4ca564f",
  perpMarket:
    "0x311a7e90fe75f32aa7d220d23d327b4b56673370f32570eb26d2e84d1da037e3",
  proxy: "0xf17742faea8c198414b2d365c7d9bde03a2da3ba0f4f8d471d8017d35f093fc5",
  insuranceFund:
    "0xa65f3a5eb4d44ae9125a5d7edb06733ba062bfc9b190844c02ed67ffb1cc2bbc",
};

export const EXPLORER_URL = "https://app.fuel.network/";

export const BETA_NETWORK = {
  name: "Fuel",
  url: "https://beta-5.fuel.network/graphql",
};

export const BETA_INDEXER_URL = "https://indexer.spark-defi.com";
