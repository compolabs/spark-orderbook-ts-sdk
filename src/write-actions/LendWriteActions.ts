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
    assetAddress: string,
    amount: string,
    options: Options,
  ): Promise<WriteTransactionResponse> => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: amount,
      assetId: assetAddress,
    };

    const tx = await lendMarketFactory.functions
      .supply_base()
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  withdrawBase = async (tokenAmount: string, options: Options) => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const tx = await lendMarketFactory.functions
      .withdraw_base(tokenAmount)
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  supplyCollateral = async (
    assetAddress: string,
    tokenAmount: string,
    options: Options,
  ) => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const forward: CoinQuantityLike = {
      amount: tokenAmount,
      assetId: assetAddress,
    };

    const tx = await lendMarketFactory.functions
      .supply_collateral()
      .callParams({ forward })
      .txParams({ gasPrice: options.gasPrice });

    return this.sendTransaction(tx, options);
  };

  withdrawCollateral = async (
    assetAddress: string,
    amount: string,
    options: Options,
  ) => {
    const lendMarketFactory = MarketAbi__factory.connect(
      options.contractAddresses.lendMarket,
      options.wallet,
    );

    const tx = await lendMarketFactory.functions
      .withdraw_collateral(assetAddress, amount)
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
