/* Autogenerated file. Do not edit manually. */

/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */

/*
  Fuels version: 0.94.1
*/

import { ContractFactory, decompressBytecode } from "fuels";
import type { Provider, Account, DeployContractOptions, DeployContractResult } from "fuels";

import { OrderbookContract } from "./OrderbookContract";

const bytecode = decompressBytecode("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");

export class OrderbookContractFactory extends ContractFactory {

  static readonly bytecode = bytecode;

  constructor(accountOrProvider: Account | Provider) {
    super(bytecode, OrderbookContract.abi, accountOrProvider);
  }

  static async deploy (
    wallet: Account,
    options: DeployContractOptions = {}
  ): Promise<DeployContractResult<OrderbookContract>> {
    const factory = new OrderbookContractFactory(wallet);

    return factory.deploy({
      storageSlots: OrderbookContract.storageSlots,
      ...options,
    });
  }
}