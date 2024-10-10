jest.mock("../src/types/market/SparkMarket");

jest.mock("../src/utils/getTotalBalance", () => ({
  getTotalBalance: jest.fn(),
}));

const BASE_CONTRACT_ADDRESS = "0xBaseContractAddress";
const CONTRACT_ADDRESS_2 = "0xContractAddress_2";
const CONTRACT_ADDRESS_3 = "0xContractAddress_3";
const CONTRACT_ADDRESS_4 = "0xContractAddress_4";

jest.mock("../src/types/market/SparkMarket", () => {
  return {
    SparkMarket: jest.fn().mockImplementation(() => ({
      id: {
        toB256: jest.fn(() => BASE_CONTRACT_ADDRESS),
      },
      functions: {
        account: jest.fn(() => ({
          isReadOnly: jest.fn(() => true),
          get: jest.fn<any>().mockResolvedValue({
            liquid: {
              base: "100",
              quote: "200",
            },
          }),
        })),
        // withdraw_to_market: jest.fn((amount, type, market) => ({
        //   amount,
        //   type,
        //   market,
        // })),
        withdraw_to_market: jest
          .fn()
          .mockImplementation((amount, type, market) => ({
            amount,
            type,
            market,
          })),
        deposit: jest.fn().mockImplementation(() => ({
          isReadOnly: jest.fn(() => false),
          callParams: jest.fn().mockImplementation((forward) => forward),
        })),
      },
    })),
  };
});

import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { WalletLocked, WalletUnlocked } from "fuels";

import { AssetType } from "../src/interface";
import { SparkMarket } from "../src/types/market/SparkMarket";
import BN from "../src/utils/BN";
import { getTotalBalance } from "../src/utils/getTotalBalance";
import { prepareDepositAndWithdrawals } from "../src/utils/prepareDepositAndWithdrawals";

const mockGetTotalBalance = getTotalBalance as jest.Mock<any>;

describe("prepareDepositAndWithdrawals", () => {
  let baseMarketFactory: any;
  let wallet: WalletLocked | WalletUnlocked;

  beforeEach(() => {
    jest.clearAllMocks();

    baseMarketFactory = new SparkMarket("", {} as any);

    wallet = {
      address: {
        toB256: jest.fn(() => "0xMockWalletAddress"),
      },
      getBalance: jest.fn(),
    } as unknown as WalletLocked | WalletUnlocked;
  });

  it("throws error when totalBalance is less than amountToSpend", async () => {
    mockGetTotalBalance.mockResolvedValue({
      totalBalance: new BN("60"),
      otherContractBalances: [new BN("20")],
      walletFeeBalance: new BN("10"),
      targetMarketBalance: new BN("30"),
    });

    await expect(
      prepareDepositAndWithdrawals({
        baseMarketFactory,
        wallet,
        assetType: AssetType.Base,
        allMarketContracts: [BASE_CONTRACT_ADDRESS, CONTRACT_ADDRESS_2],
        depositAssetId: "0xDepositAssetId",
        feeAssetId: "0xFeeAssetId",
        amountToSpend: "100",
        amountFee: "5",
      }),
    ).rejects.toThrow(
      "Insufficient balance:\nAmount to spend: 100\nFee: 5\nBalance: 60",
    );
  });

  it("throws error when walletFeeBalance is less than amountFee", async () => {
    mockGetTotalBalance.mockResolvedValue({
      totalBalance: new BN("153"),
      otherContractBalances: [new BN("100")],
      walletFeeBalance: new BN("3"),
      targetMarketBalance: new BN("50"),
    });

    await expect(
      prepareDepositAndWithdrawals({
        baseMarketFactory,
        wallet,
        assetType: AssetType.Base,
        allMarketContracts: [BASE_CONTRACT_ADDRESS, CONTRACT_ADDRESS_2],
        depositAssetId: "0xDepositAssetId",
        feeAssetId: "0xFeeAssetId",
        amountToSpend: "100",
        amountFee: "5",
      }),
    ).rejects.toThrow("Insufficient fee balance:\nFee: 5\nWallet balance: 3");
  });

  it("returns correct contract calls when balances are sufficient", async () => {
    mockGetTotalBalance.mockResolvedValue({
      totalBalance: new BN("105"),
      otherContractBalances: [new BN("25"), new BN("25")],
      walletFeeBalance: new BN("15"),
      targetMarketBalance: new BN("40"),
    });

    const mockWithdrawToMarket = baseMarketFactory.functions
      .withdraw_to_market as jest.Mock;
    const mockDeposit = baseMarketFactory.functions.deposit as jest.Mock;

    const contractCalls = await prepareDepositAndWithdrawals({
      baseMarketFactory,
      wallet,
      assetType: AssetType.Base,
      allMarketContracts: [
        BASE_CONTRACT_ADDRESS,
        CONTRACT_ADDRESS_2,
        CONTRACT_ADDRESS_3,
      ],
      depositAssetId: "0xDepositAssetId",
      feeAssetId: "0xFeeAssetId",
      amountToSpend: "100",
      amountFee: "5",
    });

    console.log(contractCalls);

    expect(mockDeposit).toHaveBeenCalledTimes(2);
    expect(mockWithdrawToMarket).toHaveBeenCalledTimes(1);
    expect(mockWithdrawToMarket).toHaveBeenCalledWith("100", AssetType.Base, {
      bits: "0xBaseContractAddress",
    });

    expect(mockDeposit).toHaveBeenCalledWith();

    expect(contractCalls).toHaveLength(2);
  });

  // it("handles remainingAmountNeeded correctly", async () => {
  //   mockGetTotalBalance.mockResolvedValue({
  //     totalBalance: new BN("200"),
  //     contractBalances: [new BN("100"), new BN("100")],
  //     walletFeeBalance: new BN("10"),
  //     targetMarketBalance: new BN("50"),
  //   });

  //   const mockWithdrawToMarket = baseMarketFactory.functions
  //     .withdraw_to_market as jest.Mock;
  //   const mockDeposit = baseMarketFactory.functions.deposit as jest.Mock;

  //   const contractCalls = await prepareDepositAndWithdrawals({
  //     baseMarketFactory,
  //     wallet,
  //     assetType: AssetType.Base,
  //     allMarketContracts: ["0xBaseContractAddress", CONTRACT_ADDRESS_2],
  //     depositAssetId: "0xDepositAssetId",
  //     feeAssetId: "0xFeeAssetId",
  //     amountToSpend: "150",
  //     amountFee: "5",
  //   });

  //   console.log(contractCalls);

  //   expect(mockWithdrawToMarket).toHaveBeenCalledTimes(1);
  //   expect(mockWithdrawToMarket).toHaveBeenCalledWith(
  //     "100", // amount (withdrawn from second contract to reach 150)
  //     AssetType.Base,
  //     { bits: "0xBaseContractAddress" },
  //   );

  //   expect(mockDeposit).toHaveBeenCalledTimes(1);
  //   expect(mockDeposit).toHaveBeenCalledWith();

  //   expect(contractCalls).toHaveLength(2);
  // });
});
