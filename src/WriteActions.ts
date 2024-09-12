import {
  CoinQuantityLike,
  FunctionInvocationScope,
  MultiCallInvocationScope,
} from "fuels";

import { SparkMarketAbi__factory } from "./types/market";
import {
  AccountOutput,
  AssetTypeInput,
  LimitTypeInput,
  OrderTypeInput,
} from "./types/market/SparkMarketAbi";
import { MultiassetContractAbi__factory } from "./types/multiasset";
import {
  AssetIdInput,
  IdentityInput,
} from "./types/multiasset/MultiassetContractAbi";

import BN from "./utils/BN";
import {
  Asset,
  AssetType,
  CreateOrderParams,
  CreateOrderWithDepositParams,
  FulfillOrderManyParams,
  Options,
  OrderType,
  WithdrawAllType,
  WriteTransactionResponse,
} from "./interface";

export class WriteActions {
  deposit = async (
    token: Asset,
    amount: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const marketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount,
      assetId: token.assetId,
    };

    const tx = marketFactory.functions.deposit().callParams({ forward });

    return this.sendTransaction(tx, options);
  };

  withdraw = async (
    amount: string,
    assetType: AssetType,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const marketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = marketFactory.functions.withdraw(
      amount,
      assetType as unknown as AssetTypeInput,
    );

    return this.sendTransaction(tx, options);
  };

  withdrawAll = async (
    assets: WithdrawAllType[],
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const marketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const assetCall = assets.map((el) =>
      marketFactory.functions.withdraw(
        el.amount,
        el.assetType as unknown as AssetTypeInput,
      ),
    );

    const tx = marketFactory.multiCall(assetCall);

    return this.sendMultiTransaction(tx, options);
  };

  createOrder = async (
    { amount, price, type }: CreateOrderParams,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const marketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = marketFactory.functions.open_order(
      amount,
      type as unknown as OrderTypeInput,
      price,
    );

    return this.sendTransaction(tx, options);
  };

  createOrderWithDeposit = async (
    {
      amount,
      amountToSpend,
      price,
      type,
      baseAssetId,
      quoteAssetId,
    }: CreateOrderWithDepositParams,
    allMarketContracts: string[], // Contracts with same assets
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const baseMarketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const identity: IdentityInput = {
      Address: {
        bits: options.wallet.address.toB256(),
      },
    };

    const isBuy = type === OrderType.Buy;
    const depositAsset = isBuy ? baseAssetId : quoteAssetId;
    const assetType = isBuy ? AssetTypeInput.Base : AssetTypeInput.Quote;

    console.log("isBuy", isBuy);
    console.log("depositAsset", depositAsset);
    console.log("assetType", assetType);

    // Fetch contract balance
    const getBalancePromises = allMarketContracts.map((contractAddress) => {
      return SparkMarketAbi__factory.connect(
        contractAddress,
        options.wallet,
      ).functions.account(identity);
    });

    const balanceMultiCallResult = await baseMarketFactory
      .multiCall(getBalancePromises)
      .get();

    // Calculate balance
    const balancesTotal = balanceMultiCallResult.value.reduce(
      (acc: BN, b: AccountOutput) => {
        const asset = isBuy ? b.liquid.base : b.liquid.quote;
        return acc.plus(new BN(asset.toString()));
      },
      BN.ZERO,
    );

    const walletBalance = await options.wallet.getBalance(depositAsset);

    // Total balance
    const totalBalance = balancesTotal.plus(walletBalance);

    if (totalBalance < amountToSpend) {
      console.log("totalBalance", totalBalance, "amountToSpend", amountToSpend);
      throw new Error("Not enough balance");
    }

    const withdrawPromises = allMarketContracts.map((contractAddress, i) => {
      const balance = balanceMultiCallResult.value[i];
      const amount = isBuy ? balance.liquid.base : balance.liquid.quote;
      return SparkMarketAbi__factory.connect(
        contractAddress,
        options.wallet,
      ).functions.withdraw(amount, assetType);
    });

    const forward: CoinQuantityLike = {
      amount: amountToSpend,
      assetId: depositAsset,
    };

    const txs = baseMarketFactory.multiCall([
      ...withdrawPromises,
      baseMarketFactory.functions.deposit().callParams({ forward }),
      baseMarketFactory.functions.open_order(
        amount,
        type as unknown as OrderTypeInput,
        price,
      ),
    ]);

    return this.sendMultiTransaction(txs, options);
  };

  cancelOrder = async (
    orderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const marketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = marketFactory.functions.cancel_order(orderId);

    return this.sendTransaction(tx, options);
  };

  matchOrders = async (
    sellOrderId: string,
    buyOrderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const marketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = marketFactory.functions.match_order_pair(
      sellOrderId,
      buyOrderId,
    );

    return this.sendTransaction(tx, options);
  };

  fulfillOrderMany = async (
    {
      amount,
      orderType,
      limitType,
      price,
      slippage,
      orders,
    }: FulfillOrderManyParams,
    options: Options,
  ) => {
    const marketFactory = SparkMarketAbi__factory.connect(
      options.contractAddresses.market,
      options.wallet,
    );

    const tx = marketFactory.functions.fulfill_order_many(
      amount,
      orderType as unknown as OrderTypeInput,
      limitType as unknown as LimitTypeInput,
      price,
      slippage,
      orders,
    );

    return this.sendTransaction(tx, options);
  };

  mintToken = async (
    token: Asset,
    amount: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const tokenFactory = options.contractAddresses.multiAsset;
    const tokenFactoryContract = MultiassetContractAbi__factory.connect(
      tokenFactory,
      options.wallet,
    );

    const mintAmount = BN.parseUnits(amount, token.decimals);

    const asset: AssetIdInput = {
      bits: token.assetId,
    };

    const identity: IdentityInput = {
      Address: {
        bits: options.wallet.address.toB256(),
      },
    };

    const tx = await tokenFactoryContract.functions.mint(
      identity,
      asset,
      mintAmount.toString(),
    );

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
