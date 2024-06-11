import { CoinQuantityLike, FunctionInvocationScope, hashMessage } from "fuels";

import { MarketContractAbi__factory } from "./types/market";
import { AssetIdInput, OrderTypeInput } from "./types/market/MarketContractAbi";
import { TokenAbi__factory } from "./types/src-20";
import { IdentityInput } from "./types/src-20/TokenAbi";
import BN from "./utils/BN";
import {
  Asset,
  Options,
  OrderType,
  WriteTransactionResponse,
} from "./interface";

export class WriteActions {
  createOrder = async (
    amount: string,
    token: Asset,
    price: string,
    type: OrderType,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const assetId: AssetIdInput = { bits: token.address };

    const amountToSend = new BN(amount).times(price);

    const forward: CoinQuantityLike = {
      amount: amountToSend.toString(),
      assetId: token.address,
    };

    const tx = await orderbookFactory.functions
      .open_order(amount, assetId, type as unknown as OrderTypeInput, price)
      .callParams({ forward })
      .txParams({ gasLimit: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  cancelOrder = async (
    orderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = await orderbookFactory.functions
      .cancel_order(orderId)
      .txParams({ gasLimit: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  matchOrders = async (
    sellOrderId: string,
    buyOrderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = orderbookFactory.functions
      .match_orders([sellOrderId, buyOrderId])
      .txParams({ gasLimit: options.gasPrice });

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
        bits: options.wallet.address.toB256(),
      },
    };

    const tx = await tokenFactoryContract.functions
      .mint(identity, hash, mintAmount.toString())
      .txParams({ gasLimit: options.gasPrice });

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
