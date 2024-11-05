import { SparkProxy } from "src/types/proxy";

import { Options } from "../interface";
import { SparkMarket } from "../types/market";
import { MultiassetContract } from "../types/multiasset";
import { SparkRegistry } from "../types/registry";

interface ContractClasses {
  SparkMarket: typeof SparkMarket;
  SparkRegistry: typeof SparkRegistry;
  MultiassetContract: typeof MultiassetContract;
  SparkProxy: typeof SparkProxy;
}

export const createContract = <T extends keyof ContractClasses>(
  contractName: T,
  options: Options,
  requiredAddress?: string,
): InstanceType<ContractClasses[T]> => {
  switch (contractName) {
    case "SparkMarket":
      return new SparkMarket(
        requiredAddress ?? options.contractAddresses.proxyMarket,
        options.wallet,
      ) as InstanceType<ContractClasses[T]>;
    case "SparkRegistry":
      return new SparkRegistry(
        requiredAddress ?? options.contractAddresses.registry,
        options.wallet,
      ) as InstanceType<ContractClasses[T]>;
    case "MultiassetContract":
      return new MultiassetContract(
        requiredAddress ?? options.contractAddresses.multiAsset,
        options.wallet,
      ) as InstanceType<ContractClasses[T]>;
    default:
      throw new Error(`Unknown contract type: ${contractName}`);
  }
};
