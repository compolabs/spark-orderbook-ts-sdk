import { Provider, Wallet, WalletUnlocked } from "fuels";

import SparkOrderbook, { Asset } from "../src";

// ⚠️⚠️⚠️ Please check the config.json file; it might be outdated. ⚠️⚠️⚠️
import CONFIG from "./config.json";

export const DEFAULT_MARKET = CONFIG.markets[0].contractId;
const INDEXER = CONFIG.indexers[DEFAULT_MARKET];

export const DEFAULT_TOKEN = CONFIG.tokens.find(
  (t) => t.symbol === "USDC",
) as Asset;

export const DEFAULT_AMOUNT = "10000";

export async function initializeSparkOrderbook(wallet?: WalletUnlocked) {
  const provider = new Provider(CONFIG.networkUrl);
  const walletProvider = wallet ?? Wallet.generate({ provider });

  const spark = new SparkOrderbook({
    networkUrl: CONFIG.networkUrl,
    contractAddresses: CONFIG.contracts,
    wallet: walletProvider,
  });

  spark.setActiveMarket(DEFAULT_MARKET, INDEXER);
  return spark;
}
