import {
  arrayify,
  CoinQuantityLike,
  FunctionInvocationScope,
  hashMessage,
} from "fuels";

import { AccountBalanceAbi__factory } from "./types/account-balance";
import { I64Input } from "./types/account-balance/AccountBalanceAbi";
import { ClearingHouseAbi__factory } from "./types/clearing-house";
import { OrderbookAbi__factory } from "./types/orderbook";
import { PerpMarketAbi__factory } from "./types/perp-market";
import { ProxyAbi__factory } from "./types/proxy";
import { PythContractAbi__factory } from "./types/pyth";
import { TokenAbi__factory } from "./types/src-20";
import { AssetIdInput, IdentityInput } from "./types/src-20/TokenAbi";
import { VaultAbi__factory } from "./types/vault";
import BN from "./utils/BN";
import { DEFAULT_DECIMALS } from "./constants";
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

  depositPerpCollateral = async (
    assetAddress: string,
    amount: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const vaultFactory = VaultAbi__factory.connect(
      options.contractAddresses.vault,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      assetId: assetAddress,
      amount,
    };

    const tx = await vaultFactory.functions
      .deposit_collateral()
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  withdrawPerpCollateral = async (
    baseTokenAddress: string,
    gasTokenAddress: string,
    amount: string,
    updateData: string[],
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const vaultFactory = VaultAbi__factory.connect(
      options.contractAddresses.vault,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: baseTokenAddress,
    };

    const parsedUpdateData = updateData.map((v) => Array.from(arrayify(v)));

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const tx = await vaultFactory.functions
      .withdraw_collateral(amount, assetIdInput)
      .callParams({ forward })
      .txParams({ gasPrice: 1 })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet,
        ),
      ]);

    return this.sendTransaction(tx, options);
  };

  openPerpOrder = async (
    baseTokenAddress: string,
    gasTokenAddress: string,
    amount: string,
    price: string,
    updateData: string[],
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const clearingHouseFactory = ClearingHouseAbi__factory.connect(
      options.contractAddresses.clearingHouse,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: baseTokenAddress,
    };

    const isNegative = amount.includes("-");
    const absSize = amount.replace("-", "");
    const baseSize: I64Input = { value: absSize, negative: isNegative };

    const parsedUpdateData = updateData.map((v) => Array.from(arrayify(v)));

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const tx = await clearingHouseFactory.functions
      .open_order(assetIdInput, baseSize, price)
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet,
        ),
      ]);

    return this.sendTransaction(tx, options);
  };

  removePerpOrder = async (
    orderId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const clearingHouseFactory = ClearingHouseAbi__factory.connect(
      options.contractAddresses.clearingHouse,
      options.wallet,
    );

    const tx = await clearingHouseFactory.functions
      .remove_order(orderId)
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse,
          options.wallet,
        ),
      ]);

    return this.sendTransaction(tx, options);
  };

  fulfillPerpOrder = async (
    gasTokenAddress: string,
    orderId: string,
    amount: string,
    updateData: string[],
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const clearingHouseFactory = ClearingHouseAbi__factory.connect(
      options.contractAddresses.clearingHouse,
      options.wallet,
    );

    const isNegative = amount.includes("-");
    const absSize = amount.replace("-", "");
    const baseSize: I64Input = { value: absSize, negative: isNegative };

    const parsedUpdateData = updateData.map((v) => Array.from(arrayify(v)));

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const tx = await clearingHouseFactory.functions
      .fulfill_order(baseSize, orderId)
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet,
        ),
      ]);

    return this.sendTransaction(tx, options);
  };

  matchPerpOrders = async (
    order1Id: string,
    order2Id: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const clearingHouseFactory = ClearingHouseAbi__factory.connect(
      options.contractAddresses.clearingHouse,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId:
        "0x0000000000000000000000000000000000000000000000000000000000000000", // for the test
    };

    const tx = await clearingHouseFactory.functions
      .match_orders(order1Id, order2Id)
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet,
        ),
      ]);

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
