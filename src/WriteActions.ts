import {
  CoinQuantityLike,
  FunctionInvocationScope,
  hashMessage,
  MultiCallInvocationScope,
} from "fuels";

import { MarketContractAbi__factory } from "./types/market";
import {
  AssetTypeInput,
  LimitTypeInput,
  OrderTypeInput,
} from "./types/market/MarketContractAbi";
import { TokenAbi__factory } from "./types/src-20";
import { IdentityInput } from "./types/src-20/TokenAbi";
import BN from "./utils/BN";
import {
  Asset,
  AssetType,
  CreateOrderParams,
  DepositParams,
  FulfillOrderManyParams,
  Options,
  WithdrawParams,
  WriteTransactionResponse,
} from "./interface";

export class WriteActions {
  deposit = async (
    token: Asset,
    amount: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount,
      assetId: token.address,
    };

    const tx = orderbookFactory.functions.deposit().callParams({ forward });

    return this.sendTransaction(tx, options);
  };

  withdraw = async (
    amount: string,
    assetType: AssetType,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = orderbookFactory.functions.withdraw(
      amount,
      assetType as unknown as AssetTypeInput,
    );

    return this.sendTransaction(tx, options);
  };

  createOrder = async (
    { amount: depositAmount, asset: depositAsset }: DepositParams,
    {
      amount,
      assetType: assetType,
      price,
      type,
      feeAssetId,
    }: CreateOrderParams,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: depositAmount,
      assetId: depositAsset,
    };

    const assetTypeInput = assetType as unknown as AssetTypeInput;

    const protocolFeeAmount = await orderbookFactory.functions
      .protocol_fee_amount(amount, assetTypeInput)
      .get();
    const matcherFee = await orderbookFactory.functions.matcher_fee().get();
    const totalAmount = new BN(protocolFeeAmount.value.toString()).plus(
      matcherFee.value,
    );

    const forwardFee: CoinQuantityLike = {
      amount: totalAmount.toString(),
      assetId: feeAssetId,
    };

    console.log(forwardFee);

    const tx = orderbookFactory
      .multiCall([
        orderbookFactory.functions.deposit().callParams({ forward }),
        orderbookFactory.functions
          .open_order(
            amount,
            assetTypeInput,
            type as unknown as OrderTypeInput,
            price,
          )
          .callParams({ forward: forwardFee }),
      ])
      .txParams({ gasLimit: options.gasPrice });

    return this.sendMultiTransaction(tx, options);
  };

  cancelOrder = async (
    { amount: withdrawAmount, assetType: withdrawAssetType }: WithdrawParams,
    orderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = orderbookFactory
      .multiCall([
        orderbookFactory.functions.cancel_order(orderId),
        orderbookFactory.functions.withdraw(
          withdrawAmount.toString(),
          withdrawAssetType as unknown as AssetTypeInput,
        ),
      ])
      .txParams({ gasLimit: options.gasPrice });

    return this.sendMultiTransaction(tx, options);
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
      .match_order_pair(sellOrderId, buyOrderId)
      .txParams({ gasLimit: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  fulfillOrderMany = async (
    { amount: depositAmount, asset: depositAsset }: DepositParams,
    {
      amount,
      assetType,
      orderType,
      limitType,
      price,
      slippage,
      orders,
      feeAssetId,
    }: FulfillOrderManyParams,
    options: Options,
  ) => {
    const orderbookFactory = MarketContractAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: depositAmount,
      assetId: depositAsset,
    };

    const assetTypeInput = assetType as unknown as AssetTypeInput;

    const protocolFeeAmount = await orderbookFactory.functions
      .protocol_fee_amount(amount, assetTypeInput)
      .get();
    const totalAmount = new BN(protocolFeeAmount.value.toString());

    const forwardFee: CoinQuantityLike = {
      amount: totalAmount.toString(),
      assetId: feeAssetId,
    };

    const tx = orderbookFactory
      .multiCall([
        orderbookFactory.functions.deposit().callParams({ forward }),
        orderbookFactory.functions
          .fulfill_order_many(
            amount,
            assetType as unknown as AssetTypeInput,
            orderType as unknown as OrderTypeInput,
            limitType as unknown as LimitTypeInput,
            price,
            slippage,
            orders,
          )
          .callParams({ forward: forwardFee }),
      ])
      .txParams({ gasLimit: options.gasPrice });

    return this.sendMultiTransaction(tx, options);
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
    const data = await res.waitForResult();

    return {
      transactionId: res.transactionId,
      value: data.value,
    };
  };

  private sendMultiTransaction = async (
    txs: MultiCallInvocationScope,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const { gasUsed } = await txs.getTransactionCost();
    const gasLimit = gasUsed.mul(options.gasLimitMultiplier).toString();
    const res = await txs.txParams({ gasLimit }).call();
    const data = await res.waitForResult();

    return {
      transactionId: res.transactionId,
      value: data.value,
    };
  };
}
