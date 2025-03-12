import { WalletLocked, WalletUnlocked } from "fuels";
import { AssetType, CompactMarketInfo } from "src/interface";
import { SparkMarket } from "src/types/market";
import { AccountOutput, IdentityInput } from "src/types/market/SparkMarket";

import BN from "./BN";
import { getAssetType } from "./getAssetType";

export const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

export interface TokenBalance {
  amount: BN;
  type?: AssetType;
}

interface GetTotalBalanceParams {
  wallet: WalletLocked | WalletUnlocked;
  depositAssetId: string;
  feeAssetId: string;
  markets: CompactMarketInfo[];
}

export interface TotalBalanceResult {
  walletBalance: BN;
  walletFeeBalance: BN;
  targetMarketBalance: TokenBalance;
  otherContractBalances: TokenBalance[];
  contractFeeBalances: TokenBalance[];
}

function processMarketBalance(
  balance: AccountOutput,
  market: CompactMarketInfo,
  depositAssetId: string,
  feeAssetId: string,
): { depositBalance: TokenBalance; feeBalance: TokenBalance } {
  const depositType = getAssetType(market, depositAssetId);
  const feeType = getAssetType(market, feeAssetId);

  const depositBalance: TokenBalance = {
    amount: depositType
      ? new BN(
          (depositType === AssetType.Base
            ? balance.liquid.base
            : balance.liquid.quote
          ).toString(),
        )
      : BN.ZERO,
    type: depositType,
  };

  const feeBalance: TokenBalance = {
    amount: feeType
      ? new BN(
          (feeType === AssetType.Base
            ? balance.liquid.base
            : balance.liquid.quote
          ).toString(),
        )
      : BN.ZERO,
    type: feeType,
  };

  return { depositBalance, feeBalance };
}

export const getTotalBalance = async ({
  wallet,
  depositAssetId,
  feeAssetId,
  markets,
}: GetTotalBalanceParams): Promise<TotalBalanceResult> => {
  if (!markets.length) {
    throw new Error("[getTotalBalance] Markets are empty");
  }

  const identity: IdentityInput = {
    Address: { bits: wallet.address.toB256() },
  };

  const baseMarketContract = getMarketContract(markets[0].contractId, wallet);
  const balancePromises = markets.map((market) =>
    getMarketContract(market.contractId, wallet).functions.account(identity),
  );

  const multiCallResult = await baseMarketContract
    .multiCall(balancePromises)
    .get();

  const depositBalances: TokenBalance[] = [];
  const feeBalances: TokenBalance[] = [];

  for (let i = 0; i < multiCallResult.value.length; i++) {
    const balance: AccountOutput = multiCallResult.value[i];
    const { depositBalance, feeBalance } = processMarketBalance(
      balance,
      markets[i],
      depositAssetId,
      feeAssetId,
    );
    depositBalances.push(depositBalance);
    feeBalances.push(feeBalance);
  }

  const targetMarketBalance = depositBalances[0];
  const otherContractBalances = depositBalances.slice(1);

  const [walletDepositRaw, walletFeeRaw] = await Promise.all([
    wallet.getBalance(depositAssetId),
    wallet.getBalance(feeAssetId),
  ]);
  const walletBalance = new BN(walletDepositRaw.toString());
  const walletFeeBalance = new BN(walletFeeRaw.toString());

  return {
    walletBalance,
    walletFeeBalance,
    targetMarketBalance,
    otherContractBalances,
    contractFeeBalances: feeBalances,
  };
};
