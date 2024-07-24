import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  BETA_CONTRACT_ADDRESSES,
  BETA_TOKENS,
  TESTNET_INDEXER_URL,
  TESTNET_NETWORK,
} from "../src";

import { PRIVATE_KEY_ALICE, TEST_TIMEOUT } from "./constants";

const TOKENS_LIST = Object.values(BETA_TOKENS).map(
  ({ decimals, assetId, symbol, priceFeed }) => ({
    address: assetId,
    symbol,
    decimals,
    priceFeed,
  }),
);

const TOKENS_BY_SYMBOL = TOKENS_LIST.reduce(
  (acc, t) => ({ ...acc, [t.symbol]: t }),
  {},
);

describe("Read Tests", () => {
  let wallet: WalletUnlocked;
  let spark: Spark;

  beforeEach(async () => {
    const provider = await Provider.create(TESTNET_NETWORK.url);
    wallet = Wallet.fromPrivateKey(PRIVATE_KEY_ALICE, provider);

    spark = new Spark({
      networkUrl: TESTNET_NETWORK.url,
      contractAddresses: BETA_CONTRACT_ADDRESSES,
      indexerApiUrl: TESTNET_INDEXER_URL,
      wallet,
    });
  });

  it(
    "fetchMarkets",
    async () => {
      const allMarkets = await spark.fetchMarkets(1);

      expect(allMarkets).toHaveLength(1);
    },
    TEST_TIMEOUT,
  );
  it(
    "fetchMarketPrice",
    async () => {
      const marketPrice = await spark.fetchMarketPrice(TOKENS_BY_SYMBOL["BTC"]);

      expect(marketPrice.toString()).toBeDefined();
    },
    TEST_TIMEOUT,
  );
  it(
    "fetchOrders",
    async () => {
      const allOrders = await spark.fetchOrders({
        limit: 1,
      });

      expect(allOrders).toHaveLength(1);
    },
    TEST_TIMEOUT,
  );
  it(
    "fetchVolume",
    async () => {
      const volume = await spark.fetchVolume();

      expect(volume).toBeDefined();
    },
    TEST_TIMEOUT,
  );
  it(
    "fetchWalletBalance",
    async () => {
      const allOrders = await spark.fetchWalletBalance(TOKENS_BY_SYMBOL["BTC"]);

      expect(allOrders).toBeDefined();
    },
    TEST_TIMEOUT,
  );
});
