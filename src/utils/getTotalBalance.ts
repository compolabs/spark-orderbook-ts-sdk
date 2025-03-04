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

  const depositBalances: BN[] = [];
  const contractFeeBalances: BN[] = [];
  const numMarkets = balanceMultiCallResult.value.length;

  for (let i = 0; i < numMarkets; i++) {
    const balance: AccountOutput = balanceMultiCallResult.value[i];

    const isDepositBase =
      getAssetType(markets[i], depositAssetId) === AssetType.Base;

    const depositAsset = isDepositBase
      ? balance.liquid.base
      : balance.liquid.quote;
    depositBalances.push(new BN(depositAsset.toString()));

    const feeAsset = balance.liquid.quote;
    contractFeeBalances.push(new BN(feeAsset.toString()));
  }

  const targetMarketBalance = depositBalances[0];
  const otherContractBalances = depositBalances.slice(1);

  const [walletBalanceRaw, walletFeeBalanceRaw] = await Promise.all([
    wallet.getBalance(depositAssetId),
    wallet.getBalance(feeAssetId),
  ]);

  const walletBalance = new BN(walletBalanceRaw.toString());
  const walletFeeBalance = new BN(walletFeeBalanceRaw.toString());

  return {
    walletBalance,
    walletFeeBalance,
    targetMarketBalance,
    otherContractBalances,
    contractFeeBalances,
  };
};
