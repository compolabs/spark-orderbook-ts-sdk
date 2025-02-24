import {
  BN,
  FunctionInvocationScope,
  WalletLocked,
  WalletUnlocked,
} from "fuels";
import { AssetType, CompactMarketInfo } from "src/interface";
import {
  AssetTypeInput,
  IdentityInput,
  SparkMarket,
} from "src/types/market/SparkMarket";

import { getAssetType } from "./getAssetType";

const getMarketContract = (
  contractAddress: string,
  wallet: WalletLocked | WalletUnlocked,
) => new SparkMarket(contractAddress, wallet);

/**
 * Prepares withdrawal calls when a specific asset is given.
 * If an amount is provided, it distributes the amount across markets.
 * If no amount is provided, it withdraws the full balance of the asset from each market.
 */
const prepareWithdrawalsForSpecificAsset = async ({
  wallet,
  assetId,
  markets,
  amount,
}: {
  wallet: WalletLocked | WalletUnlocked;
  assetId: string;
  markets: CompactMarketInfo[];
  amount?: string;
}): Promise<FunctionInvocationScope[]> => {
  const identity: IdentityInput = {
    Address: {
      bits: wallet.address.toB256(),
    },
  };

  const balancePromises = markets.map((market) =>
    getMarketContract(market.contractId, wallet).functions.account(identity),
  );
  const baseMarket = getMarketContract(markets[0].contractId, wallet);
  const balanceResult = await baseMarket.multiCall(balancePromises).get();

  const withdrawPromises: FunctionInvocationScope[] = [];
  const specifiedAmount = amount ? new BN(amount) : null;
  let remaining = specifiedAmount ? specifiedAmount.clone() : null;

  for (let i = 0; i < markets.length; i++) {
    if (remaining && remaining.isZero()) break;

    const market = markets[i];
    const assetType = getAssetType(market, assetId);
    if (!assetType) continue;

    const isBase = assetType === AssetType.Base;
    const balance = balanceResult.value[i];
    const maxAmount = isBase
      ? new BN(balance.liquid.base.toString())
      : new BN(balance.liquid.quote.toString());

    let withdrawAmount: BN;
    if (remaining) {
      withdrawAmount = remaining.gt(maxAmount) ? maxAmount : remaining;
      remaining = remaining.sub(withdrawAmount);
    } else {
      withdrawAmount = maxAmount;
    }
    if (withdrawAmount.isZero()) continue;

    const call = getMarketContract(
      market.contractId,
      wallet,
    ).functions.withdraw(
      withdrawAmount.toString(),
      assetType as unknown as AssetTypeInput,
    );
    withdrawPromises.push(call);
  }

  return withdrawPromises;
};

/**
 * Prepares withdrawal calls for all tokens from each market.
 * This function ignores the amount and assetId and withdraws both Base and Quote tokens.
 */
const prepareWithdrawalsForAllAssets = async ({
  wallet,
  markets,
}: {
  wallet: WalletLocked | WalletUnlocked;
  markets: CompactMarketInfo[];
}): Promise<FunctionInvocationScope[]> => {
  const identity: IdentityInput = {
    Address: {
      bits: wallet.address.toB256(),
    },
  };

  const balancePromises = markets.map((market) =>
    getMarketContract(market.contractId, wallet).functions.account(identity),
  );
  const baseMarket = getMarketContract(markets[0].contractId, wallet);
  const balanceResult = await baseMarket.multiCall(balancePromises).get();

  const withdrawPromises: FunctionInvocationScope[] = [];

  for (let i = 0; i < markets.length; i++) {
    const market = markets[i];
    const balance = balanceResult.value[i];

    const baseBalance = new BN(balance.liquid.base.toString());
    if (!baseBalance.isZero()) {
      const callBase = getMarketContract(
        market.contractId,
        wallet,
      ).functions.withdraw(
        baseBalance.toString(),
        AssetType.Base as unknown as AssetTypeInput,
      );
      withdrawPromises.push(callBase);
    }

    const quoteBalance = new BN(balance.liquid.quote.toString());
    if (!quoteBalance.isZero()) {
      const callQuote = getMarketContract(
        market.contractId,
        wallet,
      ).functions.withdraw(
        quoteBalance.toString(),
        AssetType.Quote as unknown as AssetTypeInput,
      );
      withdrawPromises.push(callQuote);
    }
  }

  return withdrawPromises;
};

type FullWithdrawalsParams =
  | {
      wallet: WalletLocked | WalletUnlocked;
      markets: CompactMarketInfo[];
      assetId: string;
      amount: string;
    }
  | {
      wallet: WalletLocked | WalletUnlocked;
      markets: CompactMarketInfo[];
      assetId?: undefined;
      amount?: undefined;
    };

/**
 * Prepares withdrawal calls for markets.
 * If an assetId is provided, it calls prepareWithdrawalsForSpecificAsset.
 * If assetId is not provided, it calls prepareWithdrawalsForAllAssets.
 */
export const prepareFullWithdrawals = async ({
  wallet,
  assetId,
  markets,
  amount,
}: FullWithdrawalsParams): Promise<FunctionInvocationScope[]> => {
  if (assetId) {
    return prepareWithdrawalsForSpecificAsset({
      wallet,
      assetId,
      markets,
      amount,
    });
  } else {
    return prepareWithdrawalsForAllAssets({ wallet, markets });
  }
};
