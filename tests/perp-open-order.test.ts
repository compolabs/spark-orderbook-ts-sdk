import { beforeEach, describe, expect, it } from "@jest/globals";
import { EvmPriceServiceConnection } from "@pythnetwork/pyth-evm-js";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  BETA_CONTRACT_ADDRESSES,
  BETA_INDEXER_URL,
  BETA_NETWORK,
  BN,
} from "../src";

import {
  FAUCET_AMOUNTS,
  pythURL,
  TEST_TIMEOUT,
  TOKENS_BY_SYMBOL,
} from "./constants";
import { PRIVATE_KEY_ALICE } from "./constants";

describe("Perp Open Order Tests", () => {
  let wallet: WalletUnlocked;
  let spark: Spark;

  let ordersCount: number = 0;
  let lastOrderId: string;

  const pythConnection = new EvmPriceServiceConnection(pythURL, {
    logger: {
      error: console.error,
      warn: console.warn,
      info: () => undefined,
      debug: () => undefined,
      trace: () => undefined,
    },
  });

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
    "Deposit USDT",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const address = wallet.address.toAddress();

      const collateralBalanceBeforeDeposit =
        await spark.fetchPerpCollateralBalance(address, usdc);

      await spark.mintToken(usdc, FAUCET_AMOUNTS.USDC);

      const amountToSend = BN.parseUnits(FAUCET_AMOUNTS.USDC, usdc.decimals);

      const balanceBeforeDepositString = await spark.fetchWalletBalance(usdc);
      const balanceBeforeDeposit = new BN(balanceBeforeDepositString);

      await spark.depositPerpCollateral(usdc, amountToSend.toString());

      const balanceAfterDepositString = await spark.fetchWalletBalance(usdc);
      const balanceAfterDeposit = new BN(balanceAfterDepositString);

      const collateralBalanceAfterDeposit =
        await spark.fetchPerpCollateralBalance(address, usdc);

      const shouldBalanceBeLess = balanceAfterDeposit.lt(balanceBeforeDeposit);
      const shouldCollateralBalanceBeGreater = collateralBalanceAfterDeposit.gt(
        collateralBalanceBeforeDeposit,
      );

      expect(shouldBalanceBeLess).toBe(true);
      expect(shouldCollateralBalanceBeGreater).toBe(true);
    },
    TEST_TIMEOUT,
  );

  it(
    "Get Orders Before Order",
    async () => {
      const btc = TOKENS_BY_SYMBOL["BTC"];
      const address = wallet.address.toAddress();

      const orders = await spark.fetchPerpTraderOrders(address, btc);

      expect(orders).toBeDefined();
      ordersCount = orders.length;
    },
    TEST_TIMEOUT,
  );

  it(
    "Open Order",
    async () => {
      const btc = TOKENS_BY_SYMBOL["BTC"];
      const eth = TOKENS_BY_SYMBOL["ETH"];

      const btcPriceFeed = await pythConnection.getLatestPriceFeeds([
        btc.priceFeed,
      ]);

      expect(btcPriceFeed).toBeDefined();

      const btcPrice = btcPriceFeed![0].getPriceUnchecked();
      await spark.mintToken(btc, FAUCET_AMOUNTS.BTC);

      const amountToSend = BN.parseUnits(
        FAUCET_AMOUNTS.BTC,
        btc.decimals,
      ).toString();

      await spark.openPerpOrder(
        btc,
        eth,
        amountToSend,
        btcPrice.price,
        btc.priceFeed,
      );
    },
    TEST_TIMEOUT,
  );

  it(
    "Get Order After Order",
    async () => {
      const btc = TOKENS_BY_SYMBOL["BTC"];
      const address = wallet.address.toAddress();

      const orders = await spark.fetchPerpTraderOrders(address, btc);

      const isOrdersCountIncreased = orders.length > ordersCount;
      expect(isOrdersCountIncreased).toBe(true);
      lastOrderId = orders[0].id;
      ordersCount = orders.length;
    },
    TEST_TIMEOUT,
  );

  it(
    "Close Order",
    async () => {
      expect(lastOrderId).toBeDefined();

      await spark.removePerpOrder(lastOrderId);
    },
    TEST_TIMEOUT,
  );

  it(
    "Get Orders After Cancel",
    async () => {
      const btc = TOKENS_BY_SYMBOL["BTC"];
      const address = wallet.address.toAddress();

      const orders = await spark.fetchPerpTraderOrders(address, btc);

      const isOrdersCountDecreased = orders.length < ordersCount;
      expect(isOrdersCountDecreased).toBe(true);
    },
    TEST_TIMEOUT,
  );
});
