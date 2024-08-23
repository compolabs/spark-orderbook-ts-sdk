/* Autogenerated file. Do not edit manually. */

/* eslint-disable max-classes-per-file */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/consistent-type-imports */

/*
  Fuels version: 0.94.1
*/

import { ContractFactory, decompressBytecode } from "fuels";
import type { Provider, Account, DeployContractOptions, DeployContractResult } from "fuels";

import { MultiassetContract } from "./MultiassetContract";

const bytecode = decompressBytecode("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Hq7G0RmfUJBP3AI9TWEkfp8r+byLmHMiNlNOVvT7WbMsvI2eWYH6UAm+qxWWPmLgicas+M61p3APGid6L9btAdRFGFiFz6SLqh7MsUC74+sTlf1IcBA45p+rM4fxefOWTdtu23jrnYOL09u3zfzWRTf9wa1D5e+83XlpzuduevT7H1z7ga21639+yae/ev/4h34y+S+33NF8+2jjjff+2Z9f/++f+V7v7Tf/5dvuuOPmF8sv2rvz9p0bb+29c9eOHbfeDVe3M/L7b7+49KkTbv7Rd12yuHzJtMt2vly+1hkoWbns+JtefLHwi9vft31LP57beOedW3b23rQFMjD/3bVlML1l+al1l7z09B27r/+TMz/uvfvFz+1+17V/t/Z/fHz29j075fntW96nz2/bvm3nto23bnv/ll5u8s6t23bQ99s33raFrrdt285N7+zfuP3O927pL37Kcf7u5y889Y8PZv/RHfvnb/Vf87d3586ffemcf+q4fPOn1nzixYsbjtx5923vuf1WOORr//ziRT9+//eeWtPYtv+X777k+qPf+YvHG5Z+85Yr8p97+POXLpH58+jupHa/y39OiQ4z8W+Ve9G2D/39ujt63lr95T89sfAbhQVdTbNOVV2xdPeCd//VrG9+uHHGD3702O1f+NrL/Oc4J2/qaxie+w9f+OAP31945u6W85/5xcrSq7765GeW/Oaen//tkgdv0ufK9Jr6+h+2PTez6eFHR15+6TtvWfefJ67eccnDKxd//rynjv7Pwm8uHfrkr1//XO6zTx7ZsvyKR69dXbfiwr57Xuj/ROP918vo9rty/co+ve6V65/o948c0+uEXB+uluuXH9XrI3LdB0ijvy9u1WufXL9QJteH9LmHPi/Xz2HF6e/B7+p1pl71+fs+KtdP6edPvl2ufzAq1/dtluuWH8i1C1YH+nu9Pjf3hFxnarsztZ0Zep3+a/28WK86r2mwZPMVlja+6nPTgF30VzGo1z1yrcrotVa/369XXc/ydXpFxUL6KzmuV13Xkkm9nvpfbzxXG6CtAAA=");

export class MultiassetContractFactory extends ContractFactory {

  static readonly bytecode = bytecode;

  constructor(accountOrProvider: Account | Provider) {
    super(bytecode, MultiassetContract.abi, accountOrProvider);
  }

  static async deploy (
    wallet: Account,
    options: DeployContractOptions = {}
  ): Promise<DeployContractResult<MultiassetContract>> {
    const factory = new MultiassetContractFactory(wallet);

    return factory.deploy({
      storageSlots: MultiassetContract.storageSlots,
      ...options,
    });
  }
}