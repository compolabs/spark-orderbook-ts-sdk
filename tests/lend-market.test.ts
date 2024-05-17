import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  BETA_CONTRACT_ADDRESSES,
  BETA_INDEXER_URL,
  BETA_NETWORK,
  BETA_TOKENS,
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
    const provider = await Provider.create(BETA_NETWORK.url);
    wallet = Wallet.fromPrivateKey(PRIVATE_KEY_ALICE, provider);

    spark = new Spark({
      networkUrl: BETA_NETWORK.url,
      contractAddresses: BETA_CONTRACT_ADDRESSES,
      indexerApiUrl: BETA_INDEXER_URL,
      wallet,
    });
  });

  it(
    "fetchUserSupplyBorrow",
    async () => {
      const result = await spark.fetchUserSupplyBorrow(
        wallet.address.toAddress(),
      );

      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
});
