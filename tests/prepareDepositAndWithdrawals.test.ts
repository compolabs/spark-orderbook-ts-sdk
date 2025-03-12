jest.mock("../src/types/market/SparkMarket");

jest.mock("../src/utils/getTotalBalance", () => ({
  getTotalBalance: jest.fn(),
}));

jest.mock("../src/types/market/SparkMarket", () => {
  return {
    SparkMarket: jest.fn().mockImplementation(() => ({
      id: {
        toB256: jest.fn(() => CONTRACT_ADDRESS_1.contractId),
      },
      functions: {
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

import { SparkMarket } from "../src/types/market/SparkMarket";
import BN from "../src/utils/BN";
import { getTotalBalance } from "../src/utils/getTotalBalance";
import { prepareDepositAndWithdrawals } from "../src/utils/prepareDepositAndWithdrawals";

const mockGetTotalBalance = getTotalBalance as jest.Mock<
  typeof getTotalBalance
>;

const generateContractWithAssets = (
  contractId: string,
  baseAssetId: string,
  quoteAssetId: string,
) => {
  return {
    contractId,
    baseAssetId,
    quoteAssetId,
  };
};

const ETH = "0xETH";
const USDC = "0xUSDC";
const USDT = "0xUSDT";
const WETH = "0xWETH";
const FUEL = "0xFUEL";

const CONTRACT_ADDRESS_1 = generateContractWithAssets("0x00001", ETH, USDC);
const CONTRACT_ADDRESS_2 = generateContractWithAssets("0x00002", USDC, USDT);
const CONTRACT_ADDRESS_3 = generateContractWithAssets("0x00003", USDT, USDC);
const CONTRACT_ADDRESS_4 = generateContractWithAssets("0x00004", FUEL, USDC);
const CONTRACT_ADDRESS_5 = generateContractWithAssets("0x00005", ETH, USDT);

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
      walletBalance: new BN(10), // Balance of depositAssetId
      walletFeeBalance: new BN(10), // Balance of feeAssetId
      targetMarketBalance: new BN(0), // Balance of target
      otherContractBalances: [new BN(0)], // Balance of other markets
      contractFeeBalances: [new BN(0)],
    });

    await expect(
      prepareDepositAndWithdrawals({
        baseMarketFactory,
        wallet,
        markets: [CONTRACT_ADDRESS_1, CONTRACT_ADDRESS_2],
        amountToSpend: "100",
        amountFee: "5",
        type: "Buy" as any,
      }),
    ).rejects.toThrow(
      "Insufficient balance:\nAmount to spend: 100\nExpected Fee: 5\nTotal available: 5",
    );
  });

  it("throws error when walletFeeBalance is less than amountFee", async () => {
    mockGetTotalBalance.mockResolvedValue({
      walletBalance: new BN(10), // Balance of depositAssetId
      walletFeeBalance: new BN(10), // Balance of feeAssetId
      targetMarketBalance: new BN(10), // Balance of target
      otherContractBalances: [new BN(100)], // Balance of other markets
      contractFeeBalances: [new BN(0)],
    });

    await expect(
      prepareDepositAndWithdrawals({
        baseMarketFactory,
        wallet,
        markets: [CONTRACT_ADDRESS_1, CONTRACT_ADDRESS_2],
        amountToSpend: "100",
        amountFee: "15",
        type: "Buy" as any,
      }),
    ).rejects.toThrow(
      "Insufficient wallet fee balance:\nRequired wallet fee deposit: 15\nWallet fee balance: 10",
    );
  });

  it("returns correct contract calls when balances are sufficient", async () => {
    mockGetTotalBalance.mockResolvedValue({
      walletBalance: new BN(15), // Balance of depositAssetId
      walletFeeBalance: new BN(15), // Balance of feeAssetId
      targetMarketBalance: new BN(0), // Balance of target
      otherContractBalances: [new BN(70), new BN(15), new BN(5)], // Balance of other markets
      contractFeeBalances: [new BN(0), new BN(0)],
    });

    const contractCalls = await prepareDepositAndWithdrawals({
      baseMarketFactory,
      wallet,
      markets: [
        CONTRACT_ADDRESS_1,
        CONTRACT_ADDRESS_2,
        CONTRACT_ADDRESS_3,
        CONTRACT_ADDRESS_4,
      ],
      amountToSpend: "100",
      amountFee: "5",
      type: "Buy" as any,
    });

    expect(contractCalls).toHaveLength(5);
  });

  it("handles remainingAmountNeeded correctly", async () => {
    mockGetTotalBalance.mockResolvedValue({
      walletBalance: new BN(15), // Balance of depositAssetId
      walletFeeBalance: new BN(15), // Balance of feeAssetId
      targetMarketBalance: new BN(50), // Balance of target
      otherContractBalances: [new BN(40)], // Balance of other markets
      contractFeeBalances: [new BN(0)],
    });

    const contractCalls = await prepareDepositAndWithdrawals({
      baseMarketFactory,
      wallet,
      markets: [CONTRACT_ADDRESS_1, CONTRACT_ADDRESS_2],
      amountToSpend: "100",
      amountFee: "5",
      type: "Buy" as any,
    });

    expect(contractCalls).toHaveLength(3);
  });

  it("handles fee amount correctly for BUY order", async () => {
    mockGetTotalBalance.mockResolvedValue({
      walletBalance: new BN(15), // Balance of depositAssetId
      walletFeeBalance: new BN(15), // Balance of feeAssetId
      targetMarketBalance: new BN(10), // Balance of target
      otherContractBalances: [new BN(0)], // Balance of other markets
      contractFeeBalances: [new BN(0), new BN(35)],
    });

    const contractCalls = await prepareDepositAndWithdrawals({
      baseMarketFactory,
      wallet,
      markets: [CONTRACT_ADDRESS_1, CONTRACT_ADDRESS_3],
      amountToSpend: "10",
      amountFee: "50",
      type: "Buy" as any,
    });

    expect(contractCalls).toHaveLength(2);
  });

  it("handles fee amount correctly for SELL order", async () => {
    mockGetTotalBalance.mockResolvedValue({
      walletBalance: new BN(15), // Balance of depositAssetId
      walletFeeBalance: new BN(15), // Balance of feeAssetId
      targetMarketBalance: new BN(10), // Balance of target
      otherContractBalances: [new BN(0)], // Balance of other markets
      contractFeeBalances: [new BN(0), new BN(35)],
    });

    const contractCalls = await prepareDepositAndWithdrawals({
      baseMarketFactory,
      wallet,
      markets: [CONTRACT_ADDRESS_1, CONTRACT_ADDRESS_3],
      amountToSpend: "10",
      amountFee: "50",
      type: "Sell" as any,
    });

    expect(contractCalls).toHaveLength(0);
  });
});
