import {
  BN,
  FunctionInvocationScope,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { AssetType } from "src/interface";
import {
  AssetTypeInput,
  IdentityInput,
  SparkMarket,
} from "src/types/market/SparkMarket";

const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

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
