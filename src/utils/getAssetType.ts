import { AssetType, CompactMarketInfo } from "src/interface";

export const getAssetType = (
  market: CompactMarketInfo,
  assetId: string,
): AssetType | undefined => {
  const normalizedAssetId = assetId.toLowerCase();
  const baseId = market.baseAssetId.toLowerCase();
  const quoteId = market.quoteAssetId.toLowerCase();

  if (normalizedAssetId === baseId) return AssetType.Base;
  if (normalizedAssetId === quoteId) return AssetType.Quote;

  return;
};
