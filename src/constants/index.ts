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
  vault: "0x005919151692f5103ee6dc8dd7140d51e646f8c6c967e2b246b6c7e77f976627",
  accountBalance:
    "0xb74ac6bde6ec7cfe5872e664f8348322545d49428f49fc2bd6f7a55658561cb3",
  clearingHouse:
    "0xb74ac6bde6ec7cfe5872e664f8348322545d49428f49fc2bd6f7a55658561cb3",
  perpMarket:
    "0xbfbad1c9a8495398e072dd4449c5767b675b5fda1a4889a14d056a83a3c512ae",
  proxy: "0x9e8f0ee642047db461d135291ee01370d83d25adfdc5f94fddc432b2295cde2f",
  insuranceFund:
    "0x3ce17a2cf2422f3af6db91c321ddd7cfd96079746b53d391dc1ba21f92b161d0",

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
