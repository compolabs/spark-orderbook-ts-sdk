
# spark-orderbook-ts-sdk

> [!IMPORTANT]
> Please note that the current version of the Spark SDK is a beta release. This version is still under active development and may not be stable. Users should expect frequent updates and changes as we work to improve functionality and address issues. As a beta product, this version is intended for testing and feedback purposes only. We encourage users to provide feedback as it will help us refine and enhance the SDK in preparation for a more stable release.

## Introduction

The spark-orderbook-ts-sdk is a comprehensive solution for interacting with financial markets, offering spot trading functionality. It's built on the Fuels platform, utilizing smart contracts for decentralized transaction processing. This library provides easy-to-use methods for creating and managing orders, handling tokens, and retrieving market data.

## Installation
To install the spark-orderbook-ts-sdk, follow these steps:

```bash
npm i @compolabs/spark-orderbook-ts-sdk
```

## Usage

For the latest usage examples, refer to the `examples` folder.

---

### Folder Structure

The `examples` folder includes the following files:

- **`config.json`**: Configuration file for the SDK.
- **`read.ts`**: Demonstrates how to fetch data such as orders, trade volume, and trade events.
- **`write.ts`**: Includes examples for minting tokens, depositing, creating orders, and canceling orders.
- **`utils.ts`**: Provides reusable functions for initializing the SDK with the proper configuration.

### Notes

1. **Configuration File**:  
   Ensure the `config.json` file contains accurate data. Outdated configurations may cause errors. The latest version of the configuration file can always be found [here](https://github.com/compolabs/spark-frontend-config).

2. **React Compatibility**:  
   Some subscription methods work only in React. Check comments in the `read.ts` file for details.

3. **Wallet Requirement**:  
   For write operations, ensure your wallet has sufficient ETH to send transactions.

4. **Examples First**:  
   Always refer to the `read.ts` and `write.ts` files in the `examples` folder for the latest implementation patterns.

---

## Quick Start

### 1. Setup

To use the SDK, you need to initialize a `SparkOrderbook` instance. Check the implementation in `utils.ts`.

```typescript
import { Provider, Wallet } from "fuels";
import SparkOrderbook, { Asset } from "../src";
import CONFIG from "./config.json";

export async function initializeSparkOrderbook(wallet?: Wallet) {
  const provider = await Provider.create(CONFIG.networkUrl);
  const walletProvider = wallet ?? Wallet.generate({ provider });

  const spark = new SparkOrderbook({
    networkUrl: CONFIG.networkUrl,
    contractAddresses: CONFIG.contracts,
    wallet: walletProvider,
  });

  spark.setActiveMarket(CONFIG.markets[0].contractId, CONFIG.indexers[CONFIG.markets[0].contractId]);
  return spark;
}
```

### 2. Read Operations

The `read.ts` file contains examples for fetching and subscribing to market data:

```typescript
import SparkOrderbook, { OrderType } from "../src";
import { initializeSparkOrderbook } from "./utils";

async function main() {
  const spark = await initializeSparkOrderbook();

  // Fetch active buy orders
  await spark.fetchActiveOrders(OrderType.Buy, ["defaultMarket"], 10);

  // Fetch trade volume
  await spark.fetchVolume({
    limit: 100,
    market: ["defaultMarket"],
  });
}
```

### 3. Write Operations

The `write.ts` file provides examples for write operations like creating and canceling orders:

```typescript
import SparkOrderbook, { OrderType } from "../src";
import { initializeSparkOrderbook } from "./utils";

const PRIVATE_KEY = "your-private-key"; // ⚠️ NEVER SHARE YOUR PRIVATE KEY ⚠️

async function main() {
  const spark = await initializeSparkOrderbook(Wallet.fromPrivateKey(PRIVATE_KEY));

  // Create a buy order
  await spark.createOrder({
    amount: "0.01",
    price: "7000000000000",
    type: OrderType.Buy,
  });

  // Cancel an order
  await spark.cancelOrder("orderId");
}
```

## Contributing

Contributions to improve the spark-orderbook-ts-sdk are welcome. Please feel free to fork the repository, make your changes, and submit a pull request.
