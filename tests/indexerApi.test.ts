import { beforeAll, describe, expect, it } from "@jest/globals";

import { BETA_INDEXER_URL, BETA_TOKENS } from "../src";
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
    indexer = new IndexerApi(BETA_INDEXER_URL);
  });

  it(
    "getSpotMarketCreateEvents",
    async () => {
      const response = await indexer.getSpotMarketCreateEvents();

      expect(response).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "getSpotMarketCreateEventsById",
    async () => {
      const response = await indexer.getSpotMarketCreateEvents();

      expect(response).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "getSpotOrders",
    async () => {
      const response = await indexer.getSpotOrders({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 1,
      });

      expect(response).toBeDefined();
      expect(response).toHaveLength(1);
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "getSpotTradeEvents",
    async () => {
      const response = await indexer.getSpotTradeEvents({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 1,
      });

      expect(response).toBeDefined();
      expect(response).toHaveLength(1);
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "getSpotVolume",
    async () => {
      const response = await indexer.getSpotVolume();

      expect(response).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
});
