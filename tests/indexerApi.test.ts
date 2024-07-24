import { beforeAll, describe, expect, it } from "@jest/globals";

import { BETA_TOKENS, TESTNET_INDEXER_URL } from "../src";
import { IndexerApi } from "../src/IndexerApi";

import { TEST_TIMEOUT } from "./constants";

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
    "getOrders",
    async () => {
      const response = await indexer.getOrders({
        limit: 1,
      });

      expect(response).toBeDefined();
      expect(response).toHaveLength(1);
    },
    TEST_TIMEOUT,
  );
  it(
    "getVolume",
    async () => {
      const response = await indexer.getVolume();

      expect(response).toBeDefined();
    },
    TEST_TIMEOUT,
  );
});
