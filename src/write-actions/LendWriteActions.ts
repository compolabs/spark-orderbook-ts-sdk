import { CoinQuantityLike, FunctionInvocationScope } from "fuels";
import { Options, WriteTransactionResponse } from "src/interface";
import { MarketAbi__factory } from "src/types/lend-market";
import { PythContractAbi__factory } from "src/types/pyth";

export class LendWriteActions {
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

  supplyBase = async (
    gasTokenAddress: string,
    amount: string,
    assetId: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: amount,
      assetId: assetId,
    };

    const tx = await lendMarketFactory.functions
      .supply_base()
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  withdrawBase = async (
    gasTokenAddress: string,
    tokenAmount: string,
    options: Options,
  ) => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const tx = await lendMarketFactory.functions
      .withdraw_base(tokenAmount)
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  supplyCollateral = async (gasTokenAddress: string, options: Options) => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const tx = await lendMarketFactory.functions
      .supply_collateral()
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  withdrawCollateral = async (
    gasTokenAddress: string,
    amount: string,
    assetId: string,
    options: Options,
  ) => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: "10",
      assetId: gasTokenAddress,
    };

    const tx = await lendMarketFactory.functions
      .withdraw_collateral(assetId, amount)
      .txParams({ gasPrice: options.gasPrice })
      .addContracts([
        PythContractAbi__factory.connect(
          options.contractAddresses.pyth,
          options.wallet,
        ),
      ]);

    return this.sendTransaction(tx, options);
  };
}
