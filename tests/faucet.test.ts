import { beforeEach, describe, expect, it } from "@jest/globals";
import { Provider, Wallet, WalletUnlocked } from "fuels";

import Spark, {
  BETA_CONTRACT_ADDRESSES,
  BETA_INDEXER_URL,
  BN,
  TESTNET_NETWORK,
} from "../src";

import { FAUCET_AMOUNTS, TEST_TIMEOUT, TOKENS_BY_SYMBOL } from "./constants";

const PRIVATE_KEY_ALICE = Wallet.generate().privateKey;

describe("Faucet Tests", () => {
  let wallet: WalletUnlocked;
  let spark: Spark;

  beforeEach(async () => {
    const provider = await Provider.create(TESTNET_NETWORK.url);
    wallet = Wallet.fromPrivateKey(PRIVATE_KEY_ALICE, provider);

    spark = new Spark({
      networkUrl: TESTNET_NETWORK.url,
      contractAddresses: BETA_CONTRACT_ADDRESSES,
      indexerApiUrl: BETA_INDEXER_URL,
      wallet,
    });
  });

  it(
    "should get balance of USDC",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];

      let initialBalanceString = "";
      try {
        initialBalanceString = await spark.fetchWalletBalance(usdc);
      } catch (error) {
        throw new Error("Retrieving balance should not throw an error.");
      }

      expect(initialBalanceString).toBeDefined();
      expect(initialBalanceString).not.toBe("");
    },
    TEST_TIMEOUT,
  );

  it(
    "should mint a token successfully",
    async () => {
      const usdc = TOKENS_BY_SYMBOL["USDC"];

      const initialBalanceString = await spark.fetchWalletBalance(usdc);
      const initialBalance = new BN(initialBalanceString).toNumber();

      await spark.mintToken(usdc, FAUCET_AMOUNTS.USDC);

      const newBalanceString = await spark.fetchWalletBalance(usdc);
      const newBalance = new BN(newBalanceString).toNumber();

      expect(newBalance).toBeGreaterThan(initialBalance);
    },
    TEST_TIMEOUT,
  );
});
