import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Address, Provider, Wallet } from "fuels";

import {
  DEFAULT_GAS_LIMIT_MULTIPLIER,
  DEFAULT_GAS_PRICE,
} from "../src/constants";
import { ReadActions } from "../src/ReadActions";

describe("ReadActions", () => {
  let readActions: ReadActions;

  beforeEach(async () => {
    // Reset mocks before each test
    jest.clearAllMocks();

    const provider = await Provider.create(
      "https://mainnet.fuel.network/v1/graphql",
    );

    const wallet = Wallet.generate({
      provider,
    });

    readActions = new ReadActions({
      wallet,
      contractAddresses: {
        proxyMarket:
          "0x4c9010a055ab636c38caa0e4c7cf9eb4ad8d6f44ff6e094f23b3dcdd291ee093",
        multiAsset: "multiasset_address",
        registry: "registry_address",
      },
      gasLimitMultiplier: DEFAULT_GAS_LIMIT_MULTIPLIER,
      gasPrice: DEFAULT_GAS_PRICE,
    });
  });

  it("should fetch protocol fee for user", async () => {
    const result = await readActions.fetchProtocolFee();

    expect(result).toEqual({ makerFee: "0", takerFee: "0" });
  });

  it("should fetch balances for user by contracts", async () => {
    const contractAddresses = [
      "0xfe2c524ad8e088f33d232a45dbea43e792861640b71aa1814b30506bf8430ee5",
      "0xdafe498b31f24ea5577055e86bf77e96bcba2c39a7ae47abaa819c303a45a352",
      "0xe4e4844f78e2e470b590d0c76ffc9f4422a87317377813a181a02c60a60bc774",
      "0x81e83f73530c262b0dbf5414649a875c48a48144de3c08ff68cb9d54b36f2eaa",
      "0xe4f64c6a9facdce0c055ecade9379c8f425411ec3f9523a472d14ce8a4fbce38",
      "0x12f52412e0ef50d4e38e1d03fd80d0a88fbaa7253e47f0cc48ba4e3049bd9ce4",
      "0x0bef6eb3018d901818978175feccf650b65dee8e3a8f5b59e138bcf1cf1d0db9",
      "0x2eece85eb7c8ec5fd95e639fd6bb7e9dd7103a99d7321521848da246ecef5270",
      "0x59020aadb448c59b48136a3cef110f1ddd2865000146514924f19b83f061ceba",
      "0x979ea6b1e15c1ec8e79eb76b587af89dd2620b383082e9b2c16049b78e97e4e8",
      "0x4391b39d9165917faffb9dcc69d19b6952a6ebf02db593747cf2f5d8298d28c7",
    ];

    const result = await readActions.fetchUserMarketBalanceByContracts(
      new Address(
        "0x3b9124aD72446a8cf3Ee0380d001d2549789a6C008AA6977087E7F47B69dab9E",
      ).bech32Address,
      contractAddresses,
    );

    expect(result).toHaveLength(contractAddresses.length);
  }, 15_000);
});
