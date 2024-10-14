import { WalletLocked, WalletUnlocked } from "fuels";
import { AssetType } from "src/interface";
import { SparkMarket } from "src/types/market";
import { AccountOutput, IdentityInput } from "src/types/market/SparkMarket";

import BN from "./BN";

const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

// Helper function to get the total balance (contract + wallet)
export const getTotalBalance = async ({
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

  const [targetMarketBalance, ...otherContractBalances]: BN[] =
    balanceMultiCallResult.value.map((balance: AccountOutput) => {
      const asset = isBase ? balance.liquid.base : balance.liquid.quote;
      return new BN(asset.toString());
    });

  const [walletBalance, walletFeeBalance] = await Promise.all([
    wallet.getBalance(depositAssetId),
    wallet.getBalance(feeAssetId),
  ]);
  const totalBalance = new BN(BN.sum(...otherContractBalances)).plus(
    walletBalance.toString(),
  );

  return {
    totalBalance,
    otherContractBalances,
    walletFeeBalance,
    targetMarketBalance,
  };
};
