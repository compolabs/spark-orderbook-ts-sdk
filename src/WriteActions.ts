import { FunctionInvocationScope, hashMessage } from "fuels";

import { TokenAbi__factory } from "./types/src-20";
import { IdentityInput } from "./types/src-20/TokenAbi";
import BN from "./utils/BN";
import { Asset, Options, WriteTransactionResponse } from "./interface";
import {
  LendWriteActions,
  PerpWriteActions,
  SpotWriteActions,
} from "./write-actions";

export class WriteActions {
  public perp: PerpWriteActions;
  public spot: SpotWriteActions;
  public lend: LendWriteActions;

  constructor() {
    this.perp = new PerpWriteActions(this.sendTransaction.bind(this));
    this.spot = new SpotWriteActions(this.sendTransaction.bind(this));
    this.lend = new LendWriteActions(this.sendTransaction.bind(this));
  }

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
