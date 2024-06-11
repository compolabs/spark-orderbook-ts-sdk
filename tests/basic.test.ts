import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  BETA_CONTRACT_ADDRESSES,
  BETA_TOKENS,
  TESTNET_INDEXER_URL,
  TESTNET_NETWORK,
} from "../src";

const PRIVATE_KEY_ALICE = Wallet.generate().privateKey;
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

describe("Basic Tests", () => {
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
    "Should get all orders",
    async () => {
      const allOrders = await spark.fetchOrders({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 10,
        isActive: true,
      });

      console.log(allOrders.map((o) => o.id));

      expect(allOrders).toHaveLength(10);

      console.log(allOrders);
    },
    TIMEOUT_DEADLINE,
  );
});
