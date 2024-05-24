import { CoinQuantityLike, FunctionInvocationScope } from "fuels";
import { DEFAULT_DECIMALS } from "src/constants";
import { Asset, Options, WriteTransactionResponse } from "src/interface";
import { I64Input } from "src/types/account-balance/AccountBalanceAbi";
import { OrderbookAbi__factory } from "src/types/orderbook";
import { AssetIdInput } from "src/types/src-20/TokenAbi";
import BN from "src/utils/BN";

export class SpotWriteActions {
  private sendTransaction: (
    tx: FunctionInvocationScope,
    options: Options,
  ) => Promise<WriteTransactionResponse>;

  constructor(
    sendTransaction: (
      tx: FunctionInvocationScope,
      options: Options,
    ) => Promise<WriteTransactionResponse>,
  ) {
    this.sendTransaction = sendTransaction;
  }

  createSpotOrder = async (
    baseToken: Asset,
    quoteToken: Asset,
    size: string,
    price: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = OrderbookAbi__factory.connect(
      options.contractAddresses.spotMarket,
      options.wallet,
    );

    const assetId: AssetIdInput = { value: baseToken.address };
    const isNegative = size.includes("-");
    const absSize = size.replace("-", "");
    const baseSize: I64Input = { value: absSize, negative: isNegative };

    const amountToSend = new BN(absSize)
      .times(price)
      .dividedToIntegerBy(
        new BN(10).pow(
          DEFAULT_DECIMALS + baseToken.decimals - quoteToken.decimals,
        ),
      );

    const forward: CoinQuantityLike = {
      amount: isNegative ? absSize : amountToSend.toString(),
      assetId: isNegative ? baseToken.address : quoteToken.address,
    };

    const tx = await orderbookFactory.functions
      .open_order(assetId, baseSize, price)
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  cancelSpotOrder = async (
    orderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = OrderbookAbi__factory.connect(
      options.contractAddresses.spotMarket,
      options.wallet,
    );

    const tx = await orderbookFactory.functions
      .cancel_order(orderId)
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  matchSpotOrders = async (
    sellOrderId: string,
    buyOrderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = OrderbookAbi__factory.connect(
      options.contractAddresses.spotMarket,
      options.wallet,
    );

    const tx = orderbookFactory.functions
      .match_orders(sellOrderId, buyOrderId)
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };
}
