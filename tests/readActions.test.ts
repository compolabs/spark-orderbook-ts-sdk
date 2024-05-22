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
  it(
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
    "fetchPerpCollateralBalance",
    async () => {
      const balance = await spark.fetchPerpCollateralBalance(
        wallet.address.toAddress(),
        TOKENS_BY_SYMBOL["BTC"],
      );

      expect(balance).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpAllTraderPositions",
    async () => {
      const positions = await spark.fetchPerpAllTraderPositions(
        wallet.address.toAddress(),
        BETA_TOKENS[1].assetId,
        100,
      );

      expect(positions).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpIsAllowedCollateral",
    async () => {
      const isAllowed = await spark.fetchPerpIsAllowedCollateral(
        TOKENS_BY_SYMBOL["BTC"],
      );

      expect(isAllowed).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpTraderOrders",
    async () => {
      const allOrders = await spark.fetchPerpTraderOrders(
        wallet.address.toAddress(),
        TOKENS_BY_SYMBOL["BTC"],
      );

      expect(allOrders).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpAllMarkets",
    async () => {
      const markets = await spark.fetchPerpAllMarkets(
        TOKENS_LIST,
        TOKENS_BY_SYMBOL["USDC"],
      );

      expect(markets).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpFundingRate",
    async () => {
      const rate = await spark.fetchPerpFundingRate(TOKENS_BY_SYMBOL["USDC"]);

      expect(rate).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpMaxAbsPositionSize",
    async () => {
      const size = await spark.fetchPerpMaxAbsPositionSize(
        wallet.address.toAddress(),
        TOKENS_BY_SYMBOL["BTC"],
        "100000",
      );

      expect(size).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpPendingFundingPayment",
    async () => {
      const fundingPayment = await spark.fetchPerpPendingFundingPayment(
        wallet.address.toAddress(),
        TOKENS_BY_SYMBOL["BTC"],
      );

      expect(fundingPayment).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it(
    "fetchPerpMarkPrice",
    async () => {
      const markPrice = await spark.fetchPerpMarkPrice(TOKENS_BY_SYMBOL["BTC"]);

      expect(markPrice).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
  it.skip(
    "fetchPerpTradeEvents",
    async () => {
      const allPerpTrades = await spark.fetchPerpTrades({
        baseToken: TOKENS_BY_SYMBOL["BTC"].address,
        limit: 10,
      });
      // skip because there is no enough data to test
      expect(allPerpTrades).toHaveLength(10);
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
