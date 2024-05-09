import {
  Address,
  CoinQuantityLike,
  FunctionInvocationScope,
  hashMessage,
  Script,
} from "fuels";

import { BETA_TOKENS } from "./constants/tokens";
import { AccountBalanceAbi__factory } from "./types/account-balance";
import { I64Input } from "./types/account-balance/AccountBalanceAbi";
import { ClearingHouseAbi__factory } from "./types/clearing-house";
import { OrderbookAbi__factory } from "./types/orderbook";
import { PerpMarketAbi__factory } from "./types/perp-market";
import { ProxyAbi__factory } from "./types/proxy";
import { PythContractAbi__factory } from "./types/pyth";
import { ScriptProxyAbi__factory } from "./types/script-proxy";
import {
  FulfillOrderInput,
  OpenOrderInput,
  WithdrawCollateralInput,
} from "./types/script-proxy/ScriptProxyAbi";
import ScriptProxyAbiBytes from "./types/script-proxy/ScriptProxyAbi.hex";
import { TokenAbi__factory } from "./types/src-20";
import { AssetIdInput, IdentityInput } from "./types/src-20/TokenAbi";
import { VaultAbi__factory } from "./types/vault";
import BN from "./utils/BN";
import { BETA_CONTRACT_ADDRESSES, DEFAULT_DECIMALS } from "./constants";
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
      options.contractAddresses.spotMarket.base,
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
      options.contractAddresses.spotMarket.base,
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
      options.contractAddresses.spotMarket.base,
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
    const tokenFactory = options.contractAddresses.tokenFactory.base;
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
      options.contractAddresses.vault.base,
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
    updateData: number[][],
    updateFee: BN,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const scriptProxy = new Script(
      ScriptProxyAbiBytes,
      ScriptProxyAbi__factory.abi,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: baseTokenAddress,
    };

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const priceFeedIds: unknown = BETA_TOKENS.map((v) => v.priceFeed);

    const withdrawCollateralInput: WithdrawCollateralInput = {
      vault: {
        value: new Address(BETA_CONTRACT_ADDRESSES.vault.fuel).toB256(),
      },
      amount: amount.toString(),
      collateral: assetIdInput,
    };

    const tx = await scriptProxy.functions
      .main(
        { WithdrawCollateral: withdrawCollateralInput },
        {
          value: new Address(BETA_CONTRACT_ADDRESSES.proxy.fuel).toB256(),
        },
        updateFee,
        priceFeedIds,
        updateData,
      )
      .callParams({ forward })
      .txParams({ gasPrice: 1 })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy.base,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket.base,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance.base,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse.base,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault.base,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth.base,
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
    updateData: number[][],
    updateFee: BN,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const scriptProxy = new Script(
      ScriptProxyAbiBytes,
      ScriptProxyAbi__factory.abi,
      options.wallet,
    );

    const clearingHouseFactory = ClearingHouseAbi__factory.connect(
      options.contractAddresses.clearingHouse.base,
      options.wallet,
    );

    const assetIdInput: AssetIdInput = {
      value: baseTokenAddress,
    };

    const isNegative = amount.includes("-");
    const absSize = amount.replace("-", "");
    const baseSize: I64Input = { value: absSize, negative: isNegative };

    const priceFeedIds: unknown = BETA_TOKENS.map((v) => v.priceFeed);

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const openPerpOrderInput: OpenOrderInput = {
      clearing_house: {
        value: new Address(
          BETA_CONTRACT_ADDRESSES.clearing_house.fuel,
        ).toB256(),
      },
      base_size: baseSize,
      base_token: assetIdInput,
      order_price: price,
    };

    const tx = await scriptProxy.functions
      .main(
        { OpenOrder: openPerpOrderInput },
        {
          value: new Address(BETA_CONTRACT_ADDRESSES.proxy.fuel).toB256(),
        },
        updateFee,
        priceFeedIds,
        updateData,
      )
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy.base,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket.base,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance.base,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault.base,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth.base,
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
      options.contractAddresses.clearingHouse.base,
      options.wallet,
    );

    const tx = await clearingHouseFactory.functions
      .remove_order(orderId)
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy.base,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket.base,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse.base,
          options.wallet,
        ),
      ]);

    return this.sendTransaction(tx, options);
  };

  fulfillPerpOrder = async (
    gasTokenAddress: string,
    orderId: string,
    amount: string,
    updateData: number[][],
    updateFee: BN,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const scriptProxy = new Script(
      ScriptProxyAbiBytes,
      ScriptProxyAbi__factory.abi,
      options.wallet,
    );

    const isNegative = amount.includes("-");
    const absSize = amount.replace("-", "");
    const baseSize: I64Input = { value: absSize, negative: isNegative };

    const priceFeedIds: unknown = BETA_TOKENS.map((v) => v.priceFeed);

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const fullfillPerpOrderInput: FulfillOrderInput = {
      clearing_house: {
        value: new Address(
          BETA_CONTRACT_ADDRESSES.clearing_house.fuel,
        ).toB256(),
      },
      base_size: baseSize,
      order_id: orderId,
    };

    const tx = await scriptProxy.functions
      .main(
        { FulfillOrder: fullfillPerpOrderInput },
        {
          value: new Address(BETA_CONTRACT_ADDRESSES.proxy.fuel).toB256(),
        },
        updateFee,
        priceFeedIds,
        updateData,
      )
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        ProxyAbi__factory.connect(
          options.contractAddresses.proxy.base,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket.base,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance.base,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse.base,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault.base,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth.base,
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
      options.contractAddresses.clearingHouse.base,
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
          options.contractAddresses.proxy.base,
          options.wallet,
        ),
        PerpMarketAbi__factory.connect(
          options.contractAddresses.perpMarket.base,
          options.wallet,
        ),
        AccountBalanceAbi__factory.connect(
          options.contractAddresses.accountBalance.base,
          options.wallet,
        ),
        ClearingHouseAbi__factory.connect(
          options.contractAddresses.clearingHouse.base,
          options.wallet,
        ),
        VaultAbi__factory.connect(
          options.contractAddresses.vault.base,
          options.wallet,
        ),
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth.base,
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
