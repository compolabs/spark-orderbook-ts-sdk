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
  contracts,
}: {
  wallet: WalletLocked | WalletUnlocked;
  assetType: AssetType;
  depositAssetId: string;
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
  const totalBalance = contractsBalance.plus(walletBalance.toString());

  return { totalBalance, contractBalances };
};

// Function to get deposit data and withdraw funds if necessary
export const prepareDepositAndWithdrawals = async ({
  baseMarketFactory,
  wallet,
  assetType,
  allMarketContracts,
  depositAssetId,
  amountToSpend,
}: {
  baseMarketFactory: SparkMarketAbi;
  wallet: WalletLocked | WalletUnlocked;
  assetType: AssetType;
  allMarketContracts: string[];
  depositAssetId: string;
  amountToSpend: string;
}) => {
  const { totalBalance, contractBalances } = await getTotalBalance({
    wallet,
    assetType,
    depositAssetId,
    contracts: allMarketContracts,
  });

  if (totalBalance.lte(amountToSpend)) {
    throw new Error(
      `Insufficient balance: Need ${amountToSpend}, but only have ${totalBalance}`,
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

  return [
    ...withdrawPromises,
    baseMarketFactory.functions.deposit().callParams({ forward }),
  ];
};