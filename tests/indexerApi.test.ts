import { beforeAll, describe, expect, it } from "@jest/globals";

import { BETA_TOKENS, TESTNET_INDEXER_URL } from "../src";
import { IndexerApi } from "../src/IndexerApi";

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

describe("Indexer Api Tests", () => {
  let indexer: IndexerApi;

  beforeAll(async () => {
    indexer = new IndexerApi(TESTNET_INDEXER_URL);
  });

  it(
    "getMarketCreateEvents",
    async () => {
      const response = await indexer.getMarketCreateEvents();

      expect(response).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "getOrders",
    async () => {
      const response = await indexer.getOrders({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 1,
      });

      expect(response).toBeDefined();
      expect(response).toHaveLength(1);
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "getTradeEvents",
    async () => {
      const response = await indexer.getTradeEvents({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 1,
      });

      expect(response).toBeDefined();
      expect(response).toHaveLength(1);
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "getVolume",
    async () => {
      const response = await indexer.getVolume();

      expect(response).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
});
