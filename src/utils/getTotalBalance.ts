import { WalletLocked, WalletUnlocked } from "fuels";
import { AssetType, CompactMarketInfo } from "src/interface";
import { SparkMarket } from "src/types/market";
import { AccountOutput, IdentityInput } from "src/types/market/SparkMarket";

import BN from "./BN";
import { getAssetType } from "./getAssetType";

export const _getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

interface GetTotalBalanceParams {
  wallet: WalletLocked | WalletUnlocked;
  depositAssetId: string;
  feeAssetId: string;
  markets: CompactMarketInfo[];
}

// Helper function to get balances
export const getTotalBalance = async ({
  wallet,
  depositAssetId,
  feeAssetId,
  markets,
}: GetTotalBalanceParams) => {
  const identity: IdentityInput = {
    Address: {
      bits: wallet.address.toB256(),
    },
  };

  const baseMarketFactory = _getMarketContract(markets[0].contractId, wallet);

  const getBalancePromises = markets.map((market) =>
    _getMarketContract(market.contractId, wallet).functions.account(identity),
  );

  const balanceMultiCallResult = await baseMarketFactory
    .multiCall(getBalancePromises)
    .get();

  const [targetMarketBalance, ...otherContractBalances]: BN[] =
    balanceMultiCallResult.value.map(
      (balance: AccountOutput, index: number) => {
        const isBase =
          getAssetType(markets[index], depositAssetId) === AssetType.Base;
        const asset = isBase ? balance.liquid.base : balance.liquid.quote;
        return new BN(asset.toString());
      },
    );

  const [walletBalance, walletFeeBalance] = await Promise.all([
    wallet.getBalance(depositAssetId),
    wallet.getBalance(feeAssetId),
  ]);

  return {
    walletBalance: new BN(walletBalance.toString()),
    walletFeeBalance: new BN(walletFeeBalance.toString()),
    targetMarketBalance,
    otherContractBalances,
  };
};
