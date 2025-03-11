const fakeAccountOutput1 = { liquid: { base: "100", quote: "50" } };

let callCount = 0;

jest.mock("../src/types/market/SparkMarket", () => {
  return {
    SparkMarket: jest.fn().mockImplementation(() => {
      callCount++;
      return {
        id: { toB256: jest.fn(() => Address.fromRandom().toB256()) },
        multiCall: jest.fn().mockImplementation((calls: any) => ({
          get: () =>
            Promise.resolve({
              value: calls,
            }),
        })),
        functions: {
          account: jest
            .fn()
            .mockImplementation((indentiy) => fakeAccountOutput1),
        },
      };
    }),
  };
});

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Address } from "fuels";

import BN from "../src/utils/BN";
import { getTotalBalance } from "../src/utils/getTotalBalance";

describe("getTotalBalance", () => {
  let fakeWallet: any;
  let markets: any[];

  beforeEach(() => {
    callCount = 0;
    fakeWallet = {
      address: { toB256: () => "0xwallet" },
      getBalance: jest.fn((assetId: string) => {
        const lower = assetId.toLowerCase();
        if (lower === "0xbase") return Promise.resolve("300");
        if (lower === "0xquote") return Promise.resolve("150");
        return Promise.resolve("0");
      }),
    };

    markets = [
      { contractId: "0xabc", baseAssetId: "0xbase", quoteAssetId: "0xquote" },
      { contractId: "0xdef", baseAssetId: "0xbase", quoteAssetId: "0xquote" },
    ];
  });

  it("should throw an error if no markets are provided", async () => {
    await expect(
      getTotalBalance({
        wallet: fakeWallet,
        depositAssetId: "0xbase",
        feeAssetId: "0xquote",
        markets: [],
      }),
    ).rejects.toThrow("[getTotalBalance] Markets are empty");
  });

  it("should treat non-matching depositAssetId as quote (for deposit) and use quote for fee", async () => {
    const result = await getTotalBalance({
      wallet: fakeWallet,
      depositAssetId: "0xnonexistent",
      feeAssetId: "0xnonexistent",
      markets,
    });

    expect(result.targetMarketBalance.toString()).toBe(new BN("0").toString());
    expect(result.otherContractBalances.length).toBe(1);
    expect(result.otherContractBalances[0].toString()).toBe(
      new BN("0").toString(),
    );

    expect(result.contractFeeBalances.length).toBe(2);
    expect(result.contractFeeBalances[0].toString()).toBe(
      new BN("0").toString(),
    );
    expect(result.contractFeeBalances[1].toString()).toBe(
      new BN("0").toString(),
    );

    expect(result.walletBalance.toString()).toBe(new BN("0").toString());
    expect(result.walletFeeBalance.toString()).toBe(new BN("0").toString());
  });

  it("should use depositAssetId for deposit balances when it matches (AssetType.Base)", async () => {
    const result = await getTotalBalance({
      wallet: fakeWallet,
      depositAssetId: "0xbase",
      feeAssetId: "0xquote",
      markets,
    });

    expect(result.targetMarketBalance.toString()).toBe(
      new BN("100").toString(),
    );
    expect(result.otherContractBalances.length).toBe(1);
    expect(result.otherContractBalances[0].toString()).toBe(
      new BN("100").toString(),
    );
  });

  it("should use feeAssetId for fee balances when it matches (but fee is always taken from liquid.quote)", async () => {
    const result = await getTotalBalance({
      wallet: fakeWallet,
      depositAssetId: "0xbase",
      feeAssetId: "0xquote",
      markets,
    });

    expect(result.contractFeeBalances.length).toBe(2);
    expect(result.contractFeeBalances[0].toString()).toBe(
      new BN("50").toString(),
    );
    expect(result.contractFeeBalances[1].toString()).toBe(
      new BN("50").toString(),
    );
  });

  it("should return wallet balances correctly", async () => {
    const result = await getTotalBalance({
      wallet: fakeWallet,
      depositAssetId: "0xbase",
      feeAssetId: "0xquote",
      markets,
    });

    expect(result.walletBalance.toString()).toBe(new BN("300").toString());
    expect(result.walletFeeBalance.toString()).toBe(new BN("150").toString());
  });
});
