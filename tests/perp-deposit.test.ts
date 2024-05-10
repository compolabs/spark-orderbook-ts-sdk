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

const PRIVATE_KEY_ALICE =
  "0xc47772fe3a12ed3ce28adf9c4e615d32c06f4085d1ffc3524e533ec5c0b67372";

describe("Perp Deposit \\ Withdraw Tests", () => {
  let wallet: WalletUnlocked;
  let spark: Spark;

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
    "Check ETH balance",
    async () => {
      const eth = TOKENS_BY_SYMBOL["ETH"];

      const balance = await spark.fetchWalletBalance(eth);

      const isEnoughEth = new BN(balance).gt(BN.ZERO);

      expect(isEnoughEth).toBe(true);
    },
    TEST_TIMEOUT,
  );

  it(
    "Check USDC collateral",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];

      const isUSDCAllowed = await spark.fetchPerpIsAllowedCollateral(usdc);

      expect(isUSDCAllowed).toBe(true);
    },
    TEST_TIMEOUT,
  );

  it(
    "Deposit USDC",
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
    "Withdraw USDC",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];
      const eth = TOKENS_BY_SYMBOL["ETH"];
      const address = wallet.address.toAddress();

      const collateralBalanceBeforeWithdraw =
        await spark.fetchPerpCollateralBalance(address, usdc);

      const amountToWithdraw = BN.parseUnits(
        FAUCET_AMOUNTS.USDC,
        usdc.decimals,
      );

      const balanceBeforeWithdrawString = await spark.fetchWalletBalance(usdc);
      const balanceBeforeWithdraw = new BN(balanceBeforeWithdrawString);

      await spark.withdrawPerpCollateral(
        usdc,
        eth,
        amountToWithdraw.toString(),
        usdc.priceFeed,
      );

      const balanceAfterWithdrawString = await spark.fetchWalletBalance(usdc);
      const balanceAfterWithdraw = new BN(balanceAfterWithdrawString);

      const collateralBalanceAfterWithdraw =
        await spark.fetchPerpCollateralBalance(address, usdc);

      const shouldBalanceBeGreater = balanceAfterWithdraw.gt(
        balanceBeforeWithdraw,
      );
      const shouldCollateralBalanceBeLess = collateralBalanceAfterWithdraw.lt(
        collateralBalanceBeforeWithdraw,
      );

      expect(shouldBalanceBeGreater).toBe(true);
      expect(shouldCollateralBalanceBeLess).toBe(true);
    },
    TEST_TIMEOUT,
  );
});
