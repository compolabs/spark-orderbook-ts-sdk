export const DEFAULT_DECIMALS = 9;

export const DEFAULT_GAS_PRICE = "1";
export const DEFAULT_GAS_LIMIT_MULTIPLIER = "2";

type FuelAddress = `fuel${string}`;
type EthereumAddress = `0x${string}`;

type ContractAddress = {
  base: EthereumAddress;
  fuel: FuelAddress;
};

export interface BetaContractAddresses {
  [key: string]: ContractAddress;
}

export const BETA_CONTRACT_ADDRESSES: BetaContractAddresses = {
  spotMarket: {
    base: "0x0f0c1065a7b82d026069c5cf070b21ee65713fd1ac92ec1d25eacc3100187f78",
    fuel: "fuel",
  },
  tokenFactory: {
    base: "0x6bd9643c9279204b474a778dea7f923226060cb94a4c61c5aae015cf96b5aad2",
    fuel: "fuel",
  },
  pyth: {
    base: "0x3cd5005f23321c8ae0ccfa98fb07d9a5ff325c483f21d2d9540d6897007600c9",
    fuel: "fuel",
  },
  vault: {
    base: "0x04bfef4abff72e0b8b8b96f3a89beacfa4e280a0944f74adaba34f74b9af0bd3",
    fuel: "fuel1qjl77j4l7uhqhzutjme63xl2e7jw9q9qj38hftdt5d8hfwd0p0fs75tsh3",
  },
  accountBalance: {
    base: "0x798dce97aaa21bde82cf55459d14c828238394c80ae4ea444d20667baba83dd7",
    fuel: "fuel10xxua9a25gdaaqk024ze69xg9q3c89xgptjw53zdypn8h2ag8htsruu77f",
  },
  clearingHouse: {
    base: "0xfe244b38e8783290538dd2f9de7461013a0436c69a6d193f8d2fba270e9e1655",
    fuel: "fuel1lcjykw8g0qefq5ud6tuauarpqyaqgdkxnfk3j0ud97azwr57ze2svmqlac",
  },
  perpMarket: {
    base: "0xfb8dc15d38f47c62f7b15724e3e22645435d6314cc51a5c0fc49896da3f0a397",
    fuel: "fuel1lwxuzhfc737x9aa32ujw8c3xg4p46cc5e3g6ts8ufxykmgls5wtst3953x",
  },
  proxy: {
    base: "0x5db3efcefe7c0f22566a78088fe29d6d6de73b667da0abe9e3b6e7a7d6bd458d",
    fuel: "fuel1tke7lnh70s8jy4n20qyglc5ad4k7wwmx0ks2h60rkmn6044agkxssvcgm8",
  },
  insuranceFund: {
    base: "0x9cb2e31a5e1ed73da81e2523d4935104c971b0a920a75d2ae6b7f2cc5ffbfb43",
    fuel: "fuel1njewxxj7rmtnm2q7y53afy63qnyhrv9fyzn462hxklevchlmldpssy5wlz",
  },
};

export const EXPLORER_URL = "https://app.fuel.network/";

export const BETA_NETWORK = {
  name: "Fuel",
  url: "https://beta-5.fuel.network/graphql",
};

export const BETA_INDEXER_URL = "https://indexer.spark-defi.com";
