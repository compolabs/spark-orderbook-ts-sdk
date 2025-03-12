import { CompactMarketInfo, OrderType } from "src/interface";

export const prepareAvailableMarkets = ({
  type,
  markets,
  targetId,
}: {
  type: OrderType;
  markets: CompactMarketInfo[];
  targetId: string;
}) => {
  const isBuy = type === OrderType.Buy;

  const targetMarket = markets.find(
    (m) => m.contractId.toLowerCase() === targetId.toLowerCase(),
  );

  if (!targetMarket) {
    throw new Error(
      `Target market not found in the provided markets array - ${targetId}.`,
    );
  }

  const depositAssetId = isBuy
    ? targetMarket?.quoteAssetId
    : targetMarket?.baseAssetId;
  const feeAssetId = targetMarket?.quoteAssetId;

  return markets.filter((m) => {
    // For a buy operation, we look for markets where either the quote or base asset matches our QUOTE token.
    if (isBuy) {
      return (
        m.quoteAssetId.toLowerCase() === feeAssetId.toLowerCase() ||
        m.baseAssetId.toLowerCase() === feeAssetId.toLowerCase()
      );
    }

    // For a sell operation, we look for markets where either the quote or base asset matches our BASE token.
    return (
      m.quoteAssetId.toLowerCase() === depositAssetId.toLowerCase() ||
      m.baseAssetId.toLowerCase() === depositAssetId.toLowerCase()
    );
  });
};
