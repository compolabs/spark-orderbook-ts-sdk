import BigNumber from "bignumber.js";
import {
  CoinQuantityLike,
  FunctionInvocationScope,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { CompactMarketInfo, OrderType } from "src/interface";
import { SparkMarket } from "src/types/market";
import { AssetTypeInput, ContractIdInput } from "src/types/market/SparkMarket";

import BN from "./BN";
import { Balance, getTotalBalance } from "./getTotalBalance";

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
  otherContractBalances: Balance[],
  targetMarketBalance: Balance,
  amountToSpend: string,
): { withdrawCalls: FunctionInvocationScope[]; remainingAmountNeeded: BN } => {
  const amountToSpendBN = new BN(amountToSpend);
  const withdrawCalls: FunctionInvocationScope[] = [];

  let remainingAmountNeeded = amountToSpendBN.minus(targetMarketBalance.amount);

  const spendingMarkets = sortedMarkets.filter(
    (market) =>
      market.contractId.toLowerCase() !==
      baseMarketFactory.id.toB256().toLowerCase(),
  );

  spendingMarkets.forEach((market, i) => {
    const contractBalance = otherContractBalances[i];
    if (
      contractBalance.amount.isZero() ||
      remainingAmountNeeded.isZero() ||
      remainingAmountNeeded.isNegative()
    ) {
      return;
    }

    const amount = contractBalance.amount.gt(remainingAmountNeeded)
      ? remainingAmountNeeded
      : contractBalance.amount;

    remainingAmountNeeded = remainingAmountNeeded.minus(amount);

    const marketInput: ContractIdInput = {
      bits: baseMarketFactory.id.toB256(),
    };

    const assetType = contractBalance.type;

    if (assetType) {
      console.log(
        "adding spending call",
        market.contractId,
        amount.toString(),
        assetType,
      );
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
  contractFeeBalances: Balance[],
  feeMissing: BN,
): { feeCalls: FunctionInvocationScope[]; remainingFee: BN } => {
  const feeCalls: FunctionInvocationScope[] = [];
  const otherFeeBalances = contractFeeBalances.slice(1);

  let remainingFee = feeMissing;

  otherFeeBalances.forEach((available, i) => {
    if (remainingFee.lte(BN.ZERO) || available.amount.isZero()) return;

    let amountToWithdraw: BN;

    if (available.amount.gte(remainingFee)) {
      amountToWithdraw = remainingFee;
      remainingFee = BN.ZERO;
    } else {
      amountToWithdraw = available.amount;
      remainingFee = remainingFee.minus(available.amount);
    }

    const market = sortedMarkets[i + 1];

    const marketInput: ContractIdInput = {
      bits: baseMarketFactory.id.toB256(),
    };

    if (available.type) {
      console.log(
        "adding fee call",
        market.contractId,
        amountToWithdraw.toString(),
        available.type,
      );
      feeCalls.push(
        getMarketContract(
          market.contractId,
          wallet,
        ).functions.withdraw_to_market(
          amountToWithdraw.toString(),
          available.type as unknown as AssetTypeInput,
          marketInput,
        ),
      );
    }
  });
  return { feeCalls, remainingFee };
};

const getTokens = (market: CompactMarketInfo, type: OrderType) => {
  if (type === OrderType.Buy) {
    return {
      depositAssetId: market.quoteAssetId,
      feeAssetId: market.quoteAssetId,
    };
  }
  return {
    depositAssetId: market.baseAssetId,
    feeAssetId: market.quoteAssetId,
  };
};

export const prepareDepositAndWithdrawals = async ({
  baseMarketFactory,
  wallet,
  markets,
  amountToSpend,
  amountFee,
  type,
}: {
  baseMarketFactory: SparkMarket;
  wallet: WalletLocked | WalletUnlocked;
  markets: CompactMarketInfo[];
  amountToSpend: string;
  amountFee: string;
  type: OrderType;
}): Promise<FunctionInvocationScope[]> => {
  const sortedMarkets = sortMarkets(markets, baseMarketFactory);

  const targetMarket = sortedMarkets[0];

  const { depositAssetId, feeAssetId } = getTokens(targetMarket, type);

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

  const isBuy = type === OrderType.Buy;

  const targetFeeBalance = contractFeeBalances[0];
  const expectedFee = isBuy
    ? calculateFeeMissing(targetFeeBalance.amount, new BN(amountFee))
    : BN.ZERO;
  const otherContractFeeBalancesTotal = isBuy
    ? contractFeeBalances
        .slice(1)
        .reduce((acc, curr) => acc.plus(curr.amount), BN.ZERO)
    : BN.ZERO;

  const otherContractBalancesTotal = otherContractBalances.reduce(
    (acc, curr) => acc.plus(curr.amount),
    BN.ZERO,
  );

  const totalAvailableBalance = new BigNumber(walletBalance)
    .minus(expectedFee)
    .plus(targetMarketBalance.amount)
    .plus(otherContractBalancesTotal)
    .plus(otherContractFeeBalancesTotal);

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
    expectedFee,
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
    console.log("adding fee call from wallet", forwardFee.amount.toString());
    contractCalls.push(
      baseMarketFactory.functions.deposit().callParams({ forward: forwardFee }),
    );
  }

  if (remainingAmountNeeded.gt(BN.ZERO)) {
    const forward: CoinQuantityLike = {
      amount: remainingAmountNeeded.toString(),
      assetId: depositAssetId,
    };
    console.log("adding deposit call from wallet", forward.amount.toString());
    contractCalls.push(
      baseMarketFactory.functions.deposit().callParams({ forward }),
    );
  }

  console.log("wtf", contractCalls);

  return contractCalls;
};
