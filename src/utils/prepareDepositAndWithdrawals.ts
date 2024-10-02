import {
  CoinQuantityLike,
  FunctionInvocationScope,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { AssetType } from "src/interface";
import { SparkMarket } from "src/types/market";
import {
  AccountOutput,
  AssetTypeInput,
  ContractIdInput,
  IdentityInput,
} from "src/types/market/SparkMarket";

import BN from "./BN";

const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

// Helper function to get the total balance (contract + wallet)
const getTotalBalance = async ({
  targetMarketFactory,
  wallet,
  assetType,
  depositAssetId,
  feeAssetId,
  contracts,
}: {
  targetMarketFactory: SparkMarket;
  wallet: WalletLocked | WalletUnlocked;
  assetType: AssetType;
  depositAssetId: string;
  feeAssetId: string;
  contracts: string[];
}) => {
  const isBase = assetType === AssetType.Base;

  const identity: IdentityInput = {
    Address: {
      bits: wallet.address.toB256(),
    },
  };

  const baseMarketFactory = getMarketContract(contracts[0], wallet);

  const getBalancePromises = contracts.map((contractAddress) =>
    getMarketContract(contractAddress, wallet).functions.account(identity),
  );

  const balanceMultiCallResult = await baseMarketFactory
    .multiCall(getBalancePromises)
    .get();

  const contractBalances: BN[] = balanceMultiCallResult.value.map(
    (balance: AccountOutput) => {
      const asset = isBase ? balance.liquid.base : balance.liquid.quote;
      return new BN(asset.toString());
    },
  );

  const contractsBalance = new BN(BN.sum(...contractBalances));

  const [walletBalance, walletFeeBalance] = await Promise.all([
    wallet.getBalance(depositAssetId),
    wallet.getBalance(feeAssetId),
  ]);
  const totalBalance = contractsBalance.plus(walletBalance.toString());

  const targetMarketBalanceResult = await targetMarketFactory.functions
    .account(identity)
    .get();
  const targetMarketBalance = isBase
    ? new BN(targetMarketBalanceResult.value.liquid.base.toString())
    : new BN(targetMarketBalanceResult.value.liquid.quote.toString());

  return {
    totalBalance,
    contractBalances,
    walletFeeBalance,
    targetMarketBalance,
  };
};

// Function to get deposit data and withdraw funds if necessary
export const prepareDepositAndWithdrawals = async ({
  baseMarketFactory,
  wallet,
  assetType,
  allMarketContracts,
  depositAssetId,
  feeAssetId,
  amountToSpend,
  amountFee,
}: {
  baseMarketFactory: SparkMarket;
  wallet: WalletLocked | WalletUnlocked;
  assetType: AssetType;
  allMarketContracts: string[];
  depositAssetId: string;
  feeAssetId: string;
  amountToSpend: string;
  amountFee: string;
}) => {
  const {
    totalBalance,
    contractBalances,
    walletFeeBalance,
    targetMarketBalance,
  } = await getTotalBalance({
    targetMarketFactory: baseMarketFactory,
    wallet,
    assetType,
    depositAssetId,
    feeAssetId,
    contracts: allMarketContracts,
  });

  if (totalBalance.lt(amountToSpend)) {
    throw new Error(
      `Insufficient balance: Need ${amountToSpend}, but only have ${totalBalance}`,
    );
  }

  if (walletFeeBalance.lt(amountFee)) {
    throw new Error(
      `Insufficient fee balance: Need ${amountFee}, but only have ${walletFeeBalance}`,
    );
  }

  const amountToSpendBN = new BN(amountToSpend);
  let remainingAmountNeeded = amountToSpendBN.minus(targetMarketBalance);

  // Create withdraw promises for each contract, withdrawing only what's necessary
  const withdrawPromises = allMarketContracts
    .map((contractAddress, i) => {
      let amount = contractBalances[i];

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
        bits: baseMarketFactory.id.toAddress(),
      };

      return getMarketContract(
        contractAddress,
        wallet,
      ).functions.withdraw_to_market(
        amount.toString(),
        assetType as unknown as AssetTypeInput,
        marketInput,
      );
    })
    .filter(Boolean) as FunctionInvocationScope[];

  const forwardFee: CoinQuantityLike = {
    amount: amountFee,
    assetId: feeAssetId,
  };

  return [
    ...withdrawPromises,
    baseMarketFactory.functions.deposit().callParams({ forward: forwardFee }),
  ];
};

// Function to withdraw the full balance from each contract
export const prepareFullWithdrawals = async ({
  wallet,
  assetType,
  allMarketContracts,
  amount,
}: {
  wallet: WalletLocked | WalletUnlocked;
  assetType: AssetType;
  allMarketContracts: string[];
  amount?: string;
}) => {
  const identity: IdentityInput = {
    Address: {
      bits: wallet.address.toB256(),
    },
  };

  // Fetch total balances for each contract
  const getBalancePromises = allMarketContracts.map((contractAddress) =>
    getMarketContract(contractAddress, wallet).functions.account(identity),
  );

  const baseMarketFactory = getMarketContract(allMarketContracts[0], wallet);

  const balanceMultiCallResult = await baseMarketFactory
    .multiCall(getBalancePromises)
    .get();

  const isBase = assetType === AssetType.Base;

  const specifiedAmount = amount ? new BN(amount) : null;

  // Create withdraw promises for each contract, withdrawing only what's necessary
  const withdrawPromises = allMarketContracts
    .map((contractAddress, i) => {
      const balance = balanceMultiCallResult.value[i];
      const maxAmount = isBase
        ? new BN(balance.liquid.base.toString())
        : new BN(balance.liquid.quote.toString());

      let withdrawAmount: BN;
      if (specifiedAmount) {
        withdrawAmount = specifiedAmount.gt(maxAmount)
          ? maxAmount
          : specifiedAmount;
      } else {
        withdrawAmount = maxAmount;
      }

      if (withdrawAmount.isZero()) {
        return null; // Skip if the balance is zero
      }

      return getMarketContract(contractAddress, wallet).functions.withdraw(
        withdrawAmount.toString(),
        assetType as unknown as AssetTypeInput,
      );
    })
    .filter(Boolean) as FunctionInvocationScope[];

  return withdrawPromises;
};
