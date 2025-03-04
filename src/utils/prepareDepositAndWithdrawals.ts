import {
  CoinQuantityLike,
  FunctionInvocationScope,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { AssetType, CompactMarketInfo } from "src/interface";
import { SparkMarket } from "src/types/market";
import { AssetTypeInput, ContractIdInput } from "src/types/market/SparkMarket";

import BN from "./BN";
import { getAssetType } from "./getAssetType";
import { getTotalBalance } from "./getTotalBalance";

const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

const sortMarkets = (
  markets: CompactMarketInfo[],
  baseMarketFactory: SparkMarket,
): CompactMarketInfo[] => {
  return markets.sort((market) =>
    market.contractId.toLowerCase() ===
    baseMarketFactory.id.toB256().toLowerCase()
      ? -1
      : 0,
  );
};

const calculateFeeMissing = (targetFeeBalance: BN, expectedFee: BN): BN => {
  return targetFeeBalance.lt(expectedFee)
    ? expectedFee.minus(targetFeeBalance)
    : BN.ZERO;
};

const prepareWithdrawCallsForSpending = (
  sortedMarkets: CompactMarketInfo[],
  wallet: WalletLocked | WalletUnlocked,
  baseMarketFactory: SparkMarket,
  depositAssetId: string,
  otherContractBalances: BN[],
  targetMarketBalance: BN,
  amountToSpend: string,
): { withdrawCalls: FunctionInvocationScope[]; remainingAmountNeeded: BN } => {
  const amountToSpendBN = new BN(amountToSpend);
  const withdrawCalls: FunctionInvocationScope[] = [];

  let remainingAmountNeeded = amountToSpendBN.minus(targetMarketBalance);

  const spendingMarkets = sortedMarkets.filter(
    (market) =>
      market.contractId.toLowerCase() !==
      baseMarketFactory.id.toB256().toLowerCase(),
  );

  spendingMarkets.forEach((market, i) => {
    const contractBalance = otherContractBalances[i];
    if (
      contractBalance.isZero() ||
      remainingAmountNeeded.isZero() ||
      remainingAmountNeeded.isNegative()
    ) {
      return;
    }

    const amount = contractBalance.gt(remainingAmountNeeded)
      ? remainingAmountNeeded
      : contractBalance;

    remainingAmountNeeded = remainingAmountNeeded.minus(amount);

    const marketInput: ContractIdInput = {
      bits: baseMarketFactory.id.toB256(),
    };

    const assetType = getAssetType(market, depositAssetId);

    if (assetType) {
      const call = getMarketContract(
        market.contractId,
        wallet,
      ).functions.withdraw_to_market(
        amount.toString(),
        assetType as unknown as AssetTypeInput,
        marketInput,
      );
      withdrawCalls.push(call);
    }
  });

  return { withdrawCalls, remainingAmountNeeded };
};

const prepareFeeWithdrawalCalls = (
  sortedMarkets: CompactMarketInfo[],
  wallet: WalletLocked | WalletUnlocked,
  baseMarketFactory: SparkMarket,
  contractFeeBalances: BN[],
  feeMissing: BN,
): { feeCalls: FunctionInvocationScope[]; remainingFee: BN } => {
  const feeCalls: FunctionInvocationScope[] = [];
  const otherFeeBalances = contractFeeBalances.slice(1);

  let remainingFee = feeMissing;

  otherFeeBalances.forEach((available, i) => {
    if (remainingFee.lte(BN.ZERO) || available.isZero()) return;

    let amountToWithdraw: BN;

    if (available.gte(remainingFee)) {
      amountToWithdraw = remainingFee;
      remainingFee = BN.ZERO;
    } else {
      amountToWithdraw = available;
      remainingFee = remainingFee.minus(available);
    }

    const market = sortedMarkets[i + 1];

    const marketInput: ContractIdInput = {
      bits: baseMarketFactory.id.toB256(),
    };

    feeCalls.push(
      getMarketContract(market.contractId, wallet).functions.withdraw_to_market(
        amountToWithdraw.toString(),
        AssetType.Quote as unknown as AssetTypeInput,
        marketInput,
      ),
    );
  });
  return { feeCalls, remainingFee };
};

export const prepareDepositAndWithdrawals = async ({
  baseMarketFactory,
  wallet,
  markets,
  depositAssetId,
  feeAssetId,
  amountToSpend,
  amountFee,
}: {
  baseMarketFactory: SparkMarket;
  wallet: WalletLocked | WalletUnlocked;
  markets: CompactMarketInfo[];
  depositAssetId: string;
  feeAssetId: string;
  amountToSpend: string;
  amountFee: string;
}): Promise<FunctionInvocationScope[]> => {
  const sortedMarkets = sortMarkets(markets, baseMarketFactory);

  const {
    walletBalance,
    walletFeeBalance,
    targetMarketBalance,
    otherContractBalances,
    contractFeeBalances,
  } = await getTotalBalance({
    wallet,
    depositAssetId,
    feeAssetId,
    markets: sortedMarkets,
  });

  const targetMarket = sortedMarkets[0];

  const isFeeAssetSameAsQuote =
    targetMarket.quoteAssetId.toLowerCase() === feeAssetId.toLowerCase();
  const expectedFee = isFeeAssetSameAsQuote ? new BN(amountFee) : BN.ZERO;

  const targetFeeBalance = contractFeeBalances[0];
  const feeMissing = calculateFeeMissing(targetFeeBalance, expectedFee);

  const totalAvailableBalance = new BN(walletBalance)
    .minus(feeMissing)
    .plus(new BN(targetMarketBalance))
    .plus(BN.sum(...otherContractBalances));

  if (totalAvailableBalance.lt(amountToSpend)) {
    throw new Error(
      `Insufficient balance:\nAmount to spend: ${amountToSpend}\nExpected Fee: ${expectedFee}\nTotal available: ${totalAvailableBalance}`,
    );
  }

  const { withdrawCalls, remainingAmountNeeded } =
    prepareWithdrawCallsForSpending(
      sortedMarkets,
      wallet,
      baseMarketFactory,
      depositAssetId,
      otherContractBalances,
      targetMarketBalance,
      amountToSpend,
    );
  const contractCalls: FunctionInvocationScope[] = [...withdrawCalls];

  const { feeCalls, remainingFee } = prepareFeeWithdrawalCalls(
    sortedMarkets,
    wallet,
    baseMarketFactory,
    contractFeeBalances,
    feeMissing,
  );
  contractCalls.push(...feeCalls);

  if (remainingFee.gt(BN.ZERO)) {
    if (!walletFeeBalance.gte(remainingFee.toString())) {
      throw new Error(
        `Insufficient wallet fee balance:\nRequired wallet fee deposit: ${remainingFee}\nWallet fee balance: ${walletFeeBalance}`,
      );
    }
    const forwardFee: CoinQuantityLike = {
      amount: remainingFee.toString(),
      assetId: feeAssetId,
    };
    contractCalls.push(
      baseMarketFactory.functions.deposit().callParams({ forward: forwardFee }),
    );
  }

  if (remainingAmountNeeded.gt(BN.ZERO)) {
    const forward: CoinQuantityLike = {
      amount: remainingAmountNeeded.toString(),
      assetId: depositAssetId,
    };
    contractCalls.push(
      baseMarketFactory.functions.deposit().callParams({ forward }),
    );
  }

  return contractCalls;
};
