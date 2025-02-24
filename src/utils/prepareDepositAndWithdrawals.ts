import {
  CoinQuantityLike,
  FunctionInvocationScope,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { CompactMarketInfo } from "src/interface";
import { SparkMarket } from "src/types/market";
import { AssetTypeInput, ContractIdInput } from "src/types/market/SparkMarket";

import BN from "./BN";
import { getAssetType } from "./getAssetType";
import { getTotalBalance } from "./getTotalBalance";

const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

// Function to get deposit data and withdraw funds if necessary
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
}) => {
  const sortedMarkets = markets.sort((market) => {
    if (
      market.contractId.toLowerCase() ===
      baseMarketFactory.id.toB256().toLowerCase()
    ) {
      return -1;
    }
    return 0;
  });

  const {
    walletBalance,
    walletFeeBalance,
    targetMarketBalance,
    otherContractBalances,
  } = await getTotalBalance({
    wallet,
    depositAssetId,
    feeAssetId,
    markets: sortedMarkets,
  });

  const targetMarket = sortedMarkets[0];
  const isFeeAssetSameAsQuote =
    targetMarket.quoteAssetId.toLowerCase() === feeAssetId.toLowerCase();

  if (walletFeeBalance.lt(amountFee)) {
    throw new Error(
      `Insufficient fee balance:\nFee: ${amountFee}\nWallet balance: ${walletFeeBalance}`,
    );
  }

  const expectedFee = isFeeAssetSameAsQuote ? amountFee : BN.ZERO;

  const totalBalance = walletBalance
    .minus(expectedFee)
    .plus(targetMarketBalance)
    .plus(BN.sum(...otherContractBalances));

  if (totalBalance.lt(amountToSpend)) {
    throw new Error(
      `Insufficient balance:\nAmount to spend: ${amountToSpend}\nFee: ${expectedFee}\nBalance: ${totalBalance}`,
    );
  }

  const amountToSpendBN = new BN(amountToSpend);
  let remainingAmountNeeded = amountToSpendBN.minus(targetMarketBalance);

  // Create withdraw promises for each contract, withdrawing only what's necessary
  const withdrawPromises = sortedMarkets
    .filter(
      (market) =>
        market.contractId.toLowerCase() !==
        baseMarketFactory.id.toB256().toLowerCase(),
    )
    .map((market, i) => {
      let amount = otherContractBalances[i];

      // Skip if there's no need to withdraw funds or if the contract balance is zero
      if (
        amount.isZero() ||
        remainingAmountNeeded.isZero() ||
        remainingAmountNeeded.isNegative()
      ) {
        return null;
      }

      // If the contract balance exceeds the remaining amount, withdraw only the remaining amount
      if (amount.gt(remainingAmountNeeded)) {
        amount = remainingAmountNeeded;
        remainingAmountNeeded = BN.ZERO;
      } else {
        // Otherwise, subtract the contract balance from the remaining amount and continue
        remainingAmountNeeded = remainingAmountNeeded.minus(amount);
      }

      const marketInput: ContractIdInput = {
        bits: baseMarketFactory.id.toB256(),
      };

      const assetType = getAssetType(market, depositAssetId);

      return getMarketContract(
        market.contractId,
        wallet,
      ).functions.withdraw_to_market(
        amount.toString(),
        assetType as unknown as AssetTypeInput,
        marketInput,
      );
    })
    .filter(Boolean) as FunctionInvocationScope[];

  const contractCalls = [...withdrawPromises];

  if (!new BN(amountFee).isZero()) {
    const forwardFee: CoinQuantityLike = {
      amount: amountFee,
      assetId: feeAssetId,
    };

    contractCalls.push(
      baseMarketFactory.functions.deposit().callParams({ forward: forwardFee }),
    );
  }

  if (remainingAmountNeeded.isPositive() && !remainingAmountNeeded.isZero()) {
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
