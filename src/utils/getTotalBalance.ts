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

export interface Balance {
  amount: BN;
  type?: AssetType;
}

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
  if (!markets.length) {
    throw new Error("[getTotalBalance] Markets are empty");
  }

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

  const depositBalances: Balance[] = [];
  const contractFeeBalances: Balance[] = [];
  const numMarkets = balanceMultiCallResult.value.length;

  for (let i = 0; i < numMarkets; i++) {
    const balance: AccountOutput = balanceMultiCallResult.value[i];

    const baseAssetType = getAssetType(markets[i], depositAssetId);
    const quoteAssetType = getAssetType(markets[i], feeAssetId);

    if (!baseAssetType) {
      depositBalances.push({
        amount: BN.ZERO,
        type: baseAssetType,
      });
    } else {
      const depositAsset =
        baseAssetType === AssetType.Base
          ? balance.liquid.base
          : balance.liquid.quote;
      depositBalances.push({
        amount: new BN(depositAsset.toString()),
        type: baseAssetType,
      });
    }

    if (!quoteAssetType) {
      contractFeeBalances.push({
        amount: BN.ZERO,
        type: quoteAssetType,
      });
    } else {
      const feeAsset =
        quoteAssetType === AssetType.Base
          ? balance.liquid.base
          : balance.liquid.quote;
      contractFeeBalances.push({
        amount: new BN(feeAsset.toString()),
        type: quoteAssetType,
      });
    }
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
