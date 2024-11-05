import {
  CoinQuantityLike,
  FunctionInvocationScope,
  MultiCallInvocationScope,
} from "fuels";

import {
  AssetTypeInput,
  LimitTypeInput,
  OrderTypeInput,
} from "./types/market/SparkMarket";
import {
  AssetIdInput,
  IdentityInput,
} from "./types/multiasset/MultiassetContract";

import BN from "./utils/BN";
import { createContract } from "./utils/createContract";
import { prepareDepositAndWithdrawals } from "./utils/prepareDepositAndWithdrawals";
import { prepareFullWithdrawals } from "./utils/prepareFullWithdrawals";
import {
  Asset,
  AssetType,
  CreateOrderParams,
  CreateOrderWithDepositParams,
  FulfillOrderManyParams,
  FulfillOrderManyWithDepositParams,
  Options,
  WithdrawAllType,
  WriteTransactionResponse,
} from "./interface";

export class WriteActions {
  private options: Options;

  constructor(options: Options) {
    this.options = options;
  }

  private get multiAssetContract() {
    return createContract(
      "MultiassetContract",
      this.options,
      this.options.contractAddresses.multiAsset,
    );
  }

  private getProxyMarketFactory() {
    return createContract(
      "SparkMarket",
      this.options,
      this.options.contractAddresses.proxyMarket,
    );
  }

  async deposit(
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> {
    const forward: CoinQuantityLike = {
      amount,
      assetId: token.assetId,
    };

    const tx = this.getProxyMarketFactory()
      .functions.deposit()
      .callParams({ forward });

    return this.sendTransaction(tx);
  }

  async withdraw(
    amount: string,
    assetType: AssetType,
  ): Promise<WriteTransactionResponse> {
    const tx = this.getProxyMarketFactory().functions.withdraw(
      amount,
      assetType as unknown as AssetTypeInput,
    );

    return this.sendTransaction(tx);
  }

  async withdrawAll(
    assets: WithdrawAllType[],
  ): Promise<WriteTransactionResponse> {
    const txs = assets.map((asset) =>
      this.getProxyMarketFactory().functions.withdraw(
        asset.amount,
        asset.assetType as unknown as AssetTypeInput,
      ),
    );

    const multiTx = this.getProxyMarketFactory().multiCall(txs);
    return this.sendMultiTransaction(multiTx);
  }

  async withdrawAssets(
    assetType: AssetType,
    allMarketContracts: string[],
    amount?: string,
  ): Promise<WriteTransactionResponse> {
    const withdrawTxs = await prepareFullWithdrawals({
      wallet: this.options.wallet,
      allMarketContracts,
      assetType,
      amount,
    });

    const multiTx = this.getProxyMarketFactory().multiCall(withdrawTxs);
    return this.sendMultiTransaction(multiTx);
  }

  async withdrawAllAssets(
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> {
    const [withdrawTxsBase, withdrawTxsQuote] = await Promise.all([
      prepareFullWithdrawals({
        wallet: this.options.wallet,
        allMarketContracts,
        assetType: AssetType.Base,
      }),
      prepareFullWithdrawals({
        wallet: this.options.wallet,
        allMarketContracts,
        assetType: AssetType.Quote,
      }),
    ]);

    const multiTx = this.getProxyMarketFactory().multiCall([
      ...withdrawTxsBase,
      ...withdrawTxsQuote,
    ]);
    return this.sendMultiTransaction(multiTx);
  }

  async createOrder(
    params: CreateOrderParams,
  ): Promise<WriteTransactionResponse> {
    const { amount, price, type } = params;
    const tx = this.getProxyMarketFactory().functions.open_order(
      amount,
      type as unknown as OrderTypeInput,
      price,
    );

    return this.sendTransaction(tx);
  }

  async createOrderWithDeposit(
    params: CreateOrderWithDepositParams,
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> {
    const {
      amount,
      amountToSpend,
      amountFee,
      price,
      type,
      depositAssetId,
      feeAssetId,
      assetType,
    } = params;

    const depositAndWithdrawalTxs = await prepareDepositAndWithdrawals({
      baseMarketFactory: this.getProxyMarketFactory(),
      wallet: this.options.wallet,
      amountToSpend,
      depositAssetId,
      feeAssetId,
      amountFee,
      assetType,
      allMarketContracts,
    });

    const txs = [
      ...depositAndWithdrawalTxs,
      this.getProxyMarketFactory().functions.open_order(
        amount,
        type as unknown as OrderTypeInput,
        price,
      ),
    ];

    const multiTx = this.getProxyMarketFactory().multiCall(txs);
    return this.sendMultiTransaction(multiTx);
  }

  async cancelOrder(orderId: string): Promise<WriteTransactionResponse> {
    const tx = this.getProxyMarketFactory().functions.cancel_order(orderId);

    return this.sendTransaction(tx);
  }

  async matchOrders(
    sellOrderId: string,
    buyOrderId: string,
  ): Promise<WriteTransactionResponse> {
    const tx = this.getProxyMarketFactory().functions.match_order_pair(
      sellOrderId,
      buyOrderId,
    );

    return this.sendTransaction(tx);
  }

  async fulfillOrderMany(
    params: FulfillOrderManyParams,
  ): Promise<WriteTransactionResponse> {
    const { amount, orderType, limitType, price, slippage, orders } = params;
    const tx = this.getProxyMarketFactory().functions.fulfill_order_many(
      amount,
      orderType as unknown as OrderTypeInput,
      limitType as unknown as LimitTypeInput,
      price,
      slippage,
      orders,
    );

    return this.sendTransaction(tx);
  }

  async fulfillOrderManyWithDeposit(
    params: FulfillOrderManyWithDepositParams,
    allMarketContracts: string[],
  ): Promise<WriteTransactionResponse> {
    const {
      amount,
      orderType,
      limitType,
      price,
      slippage,
      orders,
      amountToSpend,
      amountFee,
      assetType,
      depositAssetId,
      feeAssetId,
    } = params;

    const depositAndWithdrawalTxs = await prepareDepositAndWithdrawals({
      baseMarketFactory: this.getProxyMarketFactory(),
      wallet: this.options.wallet,
      amountToSpend,
      depositAssetId,
      assetType,
      allMarketContracts,
      amountFee,
      feeAssetId,
    });

    const txs = [
      ...depositAndWithdrawalTxs,
      this.getProxyMarketFactory().functions.fulfill_order_many(
        amount,
        orderType as unknown as OrderTypeInput,
        limitType as unknown as LimitTypeInput,
        price,
        slippage,
        orders,
      ),
    ];

    const multiTx = this.getProxyMarketFactory().multiCall(txs);
    return this.sendMultiTransaction(multiTx);
  }

  async mintToken(
    token: Asset,
    amount: string,
  ): Promise<WriteTransactionResponse> {
    const mintAmount = BN.parseUnits(amount, token.decimals);

    const asset: AssetIdInput = { bits: token.assetId };
    const identity: IdentityInput = {
      Address: { bits: this.options.wallet.address.toB256() },
    };

    const tx = this.multiAssetContract.functions.mint(
      identity,
      asset,
      mintAmount.toString(),
    );

    return this.sendTransaction(tx);
  }

  private async sendTransaction(
    tx: FunctionInvocationScope,
  ): Promise<WriteTransactionResponse> {
    const { gasUsed } = await tx.getTransactionCost();
    const gasLimit = gasUsed.mul(this.options.gasLimitMultiplier).toString();
    const res = await tx.txParams({ gasLimit }).call();
    const data = await res.waitForResult();

    return {
      transactionId: res.transactionId,
      value: data.value,
    };
  }

  private async sendMultiTransaction(
    txs: MultiCallInvocationScope,
  ): Promise<WriteTransactionResponse> {
    const { gasUsed } = await txs.getTransactionCost();
    const gasLimit = gasUsed.mul(this.options.gasLimitMultiplier).toString();
    const res = await txs.txParams({ gasLimit }).call();
    const data = await res.waitForResult();

    return {
      transactionId: res.transactionId,
      value: data.value,
    };
  }
}
