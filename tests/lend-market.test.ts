import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  BETA_CONTRACT_ADDRESSES,
  BETA_INDEXER_URL,
  BETA_NETWORK,
  BETA_TOKENS,
  BN,
} from "../src";

import { FAUCET_AMOUNTS, PRIVATE_KEY_ALICE, TokenAsset } from "./constants";

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

  it("Supply 20", async () => {
    const usdc: TokenAsset = TOKENS_BY_SYMBOL["USDC"];

    const result = await spark.supplyBase(usdc, "2000");

    expect(result).toBeDefined();
  });

  it("Check user collateral", async () => {
    const address = wallet.address.toAddress();
    const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
    const result = await spark.fetchUserCollateral(address, uni);
    expect(result).not.toBeNull();
  });

  it(
    "fetchUserSupplyBorrow",
    async () => {
      const result = await spark.fetchUserSupplyBorrow(
        wallet.address.toAddress(),
      );

      expect(result).not.toBeNull();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchCollateralConfigurations",
    async () => {
      const result = await spark.fetchCollateralConfigurations();
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchTotalsCollateral",
    async () => {
      const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
      const result = await spark.fetchTotalsCollateral(uni);
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchBalanceOfAsset",
    async () => {
      const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
      const result = await spark.fetchBalanceOfAsset(uni);
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchReserves",
    async () => {
      const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
      const result = await spark.fetchReserves(uni);
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchUserCollateral",
    async () => {
      const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
      const address = wallet.address.toAddress();
      const result = await spark.fetchUserCollateral(address, uni);
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchUtilization",
    async () => {
      const result = await spark.fetchUtilization();
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  // FuelError: The transaction reverted because a "require" statement has thrown "OutdatedPrice".
  it(
    "fetchAvailableToBorrow",
    async () => {
      const address = wallet.address.toAddress();
      const result = await spark.fetchAvailableToBorrow(address);
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchBorrowRate",
    async () => {
      const result = await spark.fetchBorrowRate("1000");
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "fetchSupplyRate",
    async () => {
      const result = await spark.fetchSupplyRate("1000");
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );
});

describe("Write tests", () => {
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
    "supplyBase",
    async () => {
      const usdc: TokenAsset = TOKENS_BY_SYMBOL["USDC"];

      const amountToSend = BN.parseUnits(FAUCET_AMOUNTS.USDC, usdc.decimals);

      const result = await spark.supplyBase(usdc, amountToSend.toString());
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "supplyCollateral",
    async () => {
      const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];

      const amountToSend = BN.parseUnits(FAUCET_AMOUNTS.UNI, uni.decimals);

      const result = await spark.supplyCollateral(uni, amountToSend.toString());
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "withdrawBase",
    async () => {
      const usdc: TokenAsset = TOKENS_BY_SYMBOL["USDC"];

      const amountToSend = BN.parseUnits(
        FAUCET_AMOUNTS.USDC,
        usdc.decimals,
      ).dividedBy(2);

      const result = await spark.withdrawBase(amountToSend.toString()); // Always USDC
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  it(
    "withdrawCollateral",
    async () => {
      const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];

      const amountToSend = BN.parseUnits(
        FAUCET_AMOUNTS.USDC,
        uni.decimals,
      ).dividedBy(2);

      const result = await spark.withdrawCollateral(
        uni,
        amountToSend.toString(),
      );
      expect(result).toBeDefined();
    },
    TIMEOUT_DEADLINE,
  );

  // FuelError: The transaction reverted with an unknown reason: 0
  // it(
  //   "supplyCollateral",
  //   async () => {
  //     const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
  //     const result = await spark.supplyCollateral(UNI, "0.001");
  //     expect(result).toBeDefined();
  //   },
  //   TIMEOUT_DEADLINE,
  // );

  // // FuelError: The target function withdraw_base cannot accept forwarded funds as it's not marked as 'payable'
  // it(
  //   "withdrawBase",
  //   async () => {
  //     // const address = wallet.address.toAddress();
  //     // const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
  //     const result = await spark.withdrawBase("1000");
  //     expect(result).toBeDefined();
  //   },
  //   TIMEOUT_DEADLINE,
  // );

  // // FuelError: The transaction reverted with reason: "ArithmeticOverflow".
  // it(
  //   "withdrawCollateral",
  //   async () => {
  //     const uni: TokenAsset = TOKENS_BY_SYMBOL["UNI"];
  //     const result = await spark.withdrawCollateral(UNI, "1000");
  //     expect(result).toBeDefined();
  //   },
  //   TIMEOUT_DEADLINE,
  // );
});
