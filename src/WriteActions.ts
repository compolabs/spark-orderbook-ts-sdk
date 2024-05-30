import { CoinQuantityLike, FunctionInvocationScope, hashMessage } from "fuels";
import { DEFAULT_DECIMALS } from "src/constants";

import { OrderbookAbi__factory } from "./types/orderbook";
import { I64Input } from "./types/orderbook/OrderbookAbi";
import { TokenAbi__factory } from "./types/src-20";
import { IdentityInput } from "./types/src-20/TokenAbi";
import { AssetIdInput } from "./types/src-20/TokenAbi";
import BN from "./utils/BN";
import { Asset, Options, WriteTransactionResponse } from "./interface";

export class WriteActions {
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

  mintToken = async (
    token: Asset,
    amount: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const tokenFactory = options.contractAddresses.tokenFactory;
    const tokenFactoryContract = TokenAbi__factory.connect(
      tokenFactory,
      options.wallet,
    );

    const mintAmount = BN.parseUnits(amount, token.decimals);
    const hash = hashMessage(token.symbol);
    const identity: IdentityInput = {
      Address: {
        value: options.wallet.address.toB256(),
      },
    };

    const tx = await tokenFactoryContract.functions
      .mint(identity, hash, mintAmount.toString())
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  private sendTransaction = async (
    tx: FunctionInvocationScope,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const { gasUsed } = await tx.getTransactionCost();
    const gasLimit = gasUsed.mul(options.gasLimitMultiplier).toString();
    const res = await tx.txParams({ gasLimit }).call();

    return {
      transactionId: res.transactionId,
      value: res.value,
    };
  };
}
