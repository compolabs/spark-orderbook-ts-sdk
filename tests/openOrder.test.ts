import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  AssetType,
  BETA_CONTRACT_ADDRESSES,
  BETA_TOKENS,
  BN,
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

  it(
    "Fetch user orders",
    async () => {
      const data = await spark.fetchOrderIdsByAddress(
        wallet.address.toAddress(),
      );

      console.log("ORDERS DATA", data);

      expect(data).toBeDefined();
    },
    TEST_TIMEOUT,
  );

  it.skip(
    "Fetch order",
    async () => {
      const data = await spark.fetchOrderById(
        "0xf93343da722c95c59bc77cb085f411cf83f0912f4c60571b1fa429a3ab8f88a4",
      );

      console.log("ORDER DATA", {
        ...data,
        baseSize: data?.baseSize.toString(),
        orderPrice: data?.orderPrice.toString(),
      });

      expect(data).toBeDefined();
    },
    TEST_TIMEOUT,
  );

  // amount: this.mode === ORDER_MODE.BUY ? this.inputTotal.toString() : this.inputAmount.toString(),
  // asset: this.mode === ORDER_MODE.BUY ? market.quoteToken.assetId : market.baseToken.assetId,

  it(
    "Open buy order",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const amount = new BN("1"); // BTC

      const price = "61386860766500";

      const createOrderParams = {
        amount: "547820",
        assetType: AssetType.Base,
        price,
        type: OrderType.Buy,
      };

      const data = await spark.createOrder(
        {
          amount: "336289500",
          asset:
            "0xfed3ee85624c79cb18a3a848092239f2e764ed6b0aa156ad10a18bfdbe74269f",
        },
        createOrderParams,
      );

      console.log("CREATE ORDER DATA", data);

      expect(data.transactionId).toBeDefined();
    },
    TEST_TIMEOUT,
  );

  it(
    "Open sell order",
    async () => {
      const btc = TOKENS_BY_SYMBOL["BTC"];
      const amount = "100"; // USDC

      const price = "61143285305490";

      const createOrderParams = {
        amount,
        assetType: AssetType.Base,
        price,
        type: OrderType.Sell,
      };

      const data = await spark.createOrder(
        {
          amount,
          asset: btc.address,
        },
        createOrderParams,
      );

      console.log("CREATE ORDER DATA", data);

      expect(data.transactionId).toBeDefined();
    },
    TEST_TIMEOUT,
  );
});
