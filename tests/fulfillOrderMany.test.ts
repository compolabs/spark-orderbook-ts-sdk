import { beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  AssetType,
  BETA_CONTRACT_ADDRESSES,
  BETA_TOKENS,
  FulfillOrderManyParams,
  OrderType,
  TESTNET_INDEXER_URL,
  TESTNET_NETWORK,
} from "../src";
import { IndexerApi } from "../src/IndexerApi";

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

describe("Fulfill Order Many Test", () => {
  let wallet: WalletUnlocked;
  let spark: Spark;

  let indexer: IndexerApi;

  beforeAll(async () => {
    indexer = new IndexerApi(TESTNET_INDEXER_URL);
  });

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
    "Market Order Buy Fulfillment Test",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const buyToken = TOKENS_BY_SYMBOL["BTC"];
      const amount = "2000";
      const price = "61143285305490";
      const depositParams = {
        amount: (Number(amount) * Number(price)).toString(),
        asset: buyToken.address,
      };

      const orderResponse = await indexer.getOrders({
        limit: 10,
      });

      const fulfillOrderManyParams: FulfillOrderManyParams = {
        amount: amount,
        assetType: AssetType.Base,
        orderType: OrderType.Buy,
        price,
        slippage: "100",
        orders: orderResponse.map((order) => order.id),
      };

      try {
        const result = await spark.fulfillOrderMany(
          depositParams,
          fulfillOrderManyParams,
        );

        console.log("MATCH ORDERS RESULT", result);
        expect(result).toBeDefined();
      } catch (error) {
        console.error("Error matching orders:", error);
        expect(error).toBeUndefined();
      }
    },
    TEST_TIMEOUT,
  );

  it(
    "Market Order Sell Fulfillment Test",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const buyToken = TOKENS_BY_SYMBOL["BTC"];
      const amount = "2000";
      const price = "61143285305490";
      const depositParams = {
        amount: amount,
        asset: usdc.address,
      };

      const orderResponse = await indexer.getOrders({
        limit: 10,
      });

      const fulfillOrderManyParams: FulfillOrderManyParams = {
        amount: amount,
        assetType: AssetType.Base,
        orderType: OrderType.Buy,
        price: price,
        slippage: "100",
        orders: orderResponse.map((order) => order.id),
      };

      try {
        const result = await spark.fulfillOrderMany(
          depositParams,
          fulfillOrderManyParams,
        );

        console.log("MATCH ORDERS RESULT", result);
        expect(result).toBeDefined();
      } catch (error) {
        console.error("Error matching orders:", error);
        expect(error).toBeUndefined();
      }
    },
    TEST_TIMEOUT,
  );
});
