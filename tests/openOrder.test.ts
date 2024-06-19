import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  AssetType,
  BETA_CONTRACT_ADDRESSES,
  BETA_TOKENS,
  OrderType,
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

describe("Open Order Test", () => {
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
    "Trying to deposit",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const amount = "200000000"; // USDC

      const data = await spark.deposit(usdc, amount);

      console.log("DEPOSIT DATA", data);

      expect(data.transactionId).toBeDefined();
    },
    TEST_TIMEOUT,
  );

  it.only(
    "Open buy order",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const amount = "200"; // USDC

      const price = "1";

      const data = await spark.createOrder(amount, usdc, AssetType.Quote, price, OrderType.Sell);

      console.log("CREATE ORDER DATA", data);

      expect(data.transactionId).toBeDefined();
    },
    TEST_TIMEOUT,
  );

  it(
    "Open sell order",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const amount = "100"; // USDC
      // const amountToSend = BN.parseUnits(amount, usdc.decimals);

      console.log("send amount", amount.toString());

      const price = "1";

      const data = await spark.createOrder(
        amount.toString(),
        usdc,
        AssetType.Quote,
        price,
        OrderType.Sell,
      );

      console.log("CREATE ORDER DATA", data);

      expect(data.transactionId).toBeDefined();
    },
    TEST_TIMEOUT,
  );
});
