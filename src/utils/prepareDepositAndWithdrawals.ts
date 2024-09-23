import {
  CoinQuantityLike,
  FunctionInvocationScope,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { AssetType } from "src/interface";
import { SparkMarketAbi__factory } from "src/types/market";
import {
  AccountOutput,
  AssetTypeInput,
  IdentityInput,
  SparkMarketAbi,
} from "src/types/market/SparkMarketAbi";

import BN from "./BN";

const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => SparkMarketAbi__factory.connect(contractAddress, wallet);

// Helper function to get the total balance (contract + wallet)
const getTotalBalance = async ({
  wallet,
  assetType,
  depositAssetId,
  feeAssetId,
  contracts,
}: {
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

  const walletBalance = await wallet.getBalance(depositAssetId);
  const walletFeeBalance = await wallet.getBalance(feeAssetId);
  const totalBalance = contractsBalance.plus(walletBalance.toString());

  return { totalBalance, contractBalances, walletFeeBalance };
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
  baseMarketFactory: SparkMarketAbi;
  wallet: WalletLocked | WalletUnlocked;
  assetType: AssetType;
  allMarketContracts: string[];
  depositAssetId: string;
  feeAssetId: string;
  amountToSpend: string;
  amountFee: string;
}) => {
  const { totalBalance, contractBalances, walletFeeBalance } =
    await getTotalBalance({
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

  let remainingAmountToWithdraw = new BN(amountToSpend);

  // Create withdraw promises for each contract, withdrawing only what's necessary
  const withdrawPromises = allMarketContracts
    .map((contractAddress, i) => {
      let amount = contractBalances[i];

      // Skip if there's no need to withdraw funds or if the contract balance is zero
      if (amount.isZero() || remainingAmountToWithdraw.isZero()) {
        return null;
      }

      // If the contract balance exceeds the remaining amount, withdraw only the remaining amount
      if (amount.gt(remainingAmountToWithdraw)) {
        amount = remainingAmountToWithdraw;
        remainingAmountToWithdraw = BN.ZERO;
      } else {
        // Otherwise, subtract the contract balance from the remaining amount and continue
        remainingAmountToWithdraw = remainingAmountToWithdraw.minus(amount);
      }

      return getMarketContract(contractAddress, wallet).functions.withdraw(
        amount.toString(),
        assetType as unknown as AssetTypeInput,
      );
    })
    .filter(Boolean) as FunctionInvocationScope[];

  const forward: CoinQuantityLike = {
    amount: amountToSpend,
    assetId: depositAssetId,
  };

  const forwardFee: CoinQuantityLike = {
    amount: amountFee,
    assetId: feeAssetId,
  };

  return [
    ...withdrawPromises,
    baseMarketFactory.functions.deposit().callParams({ forward }),
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
