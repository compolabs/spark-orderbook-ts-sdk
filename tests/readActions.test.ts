import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  BETA_CONTRACT_ADDRESSES,
  BETA_TOKENS,
  TESTNET_INDEXER_URL,
  TESTNET_NETWORK,
} from "../src";

import { PRIVATE_KEY_ALICE } from "./constants";

const TIMEOUT_DEADLINE = 60_000; // 1min

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
    "fetchSpotMarkets",
    async () => {
      const allMarkets = await spark.fetchSpotMarkets(1);

      expect(allMarkets).toHaveLength(1);
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchSpotMarketPrice",
    async () => {
      const marketPrice = await spark.fetchSpotMarketPrice(
        TOKENS_BY_SYMBOL["BTC"],
      );

      expect(marketPrice.toString()).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchSpotOrders",
    async () => {
      const allSpotOrders = await spark.fetchSpotOrders({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 1,
        isActive: true,
      });

      expect(allSpotOrders).toHaveLength(1);
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchSpotTrades",
    async () => {
      const allSpotTrades = await spark.fetchSpotTrades({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 10,
      });

      expect(allSpotTrades).toHaveLength(10);
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchSpotVolume",
    async () => {
      const volume = await spark.fetchSpotVolume();

      expect(volume).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it.skip(
    "fetchSpotOrderById",
    async () => {
      const allSpotTrades = await spark.fetchSpotTrades({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 1,
      });

      expect(allSpotTrades).toHaveLength(1);

      const order = await spark.fetchSpotOrderById(allSpotTrades[0].id);

      expect(order).toBeDefined;
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchWalletBalance",
    async () => {
      const allOrders = await spark.fetchWalletBalance(TOKENS_BY_SYMBOL["BTC"]);

      expect(allOrders).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
});
