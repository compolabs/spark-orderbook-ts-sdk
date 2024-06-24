
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

To use the spark-orderbook-ts-sdk, you'll need to set up a `Spark` instance with the appropriate configuration:

```typescript
import Spark, { TESTNET_NETWORK, BETA_CONTRACT_ADDRESSES, TESTNET_INDEXER_URL } from "spark-orderbook-ts-sdk";

// Create a wallet instance
const provider = await Provider.create(TESTNET_NETWORK.url);
const wallet = Wallet.fromPrivateKey(/* PRIVATE KEY */, provider);

const spark = new Spark({
  networkUrl: TESTNET_NETWORK.url,
  contractAddresses: BETA_CONTRACT_ADDRESSES,
  indexerApiUrl: TESTNET_INDEXER_URL,
  wallet,
});
// Now you can use `spark` to interact with the library methods
```

## Available Methods

Below is a list of all the available methods in the spark-orderbook-ts-sdk. These methods enable interaction with spot market:

1. **setActiveWallet(wallet?: WalletLocked | WalletUnlocked)** - Updates the active wallet used in the library.
2. **createOrder(baseToken: Asset, quoteToken: Asset, size: string, price: string)** - Creates an order with the specified parameters.
3. **cancelOrder(orderId: string)** - Cancels a specified order.
4. **matchOrders(sellOrderId: string, buyOrderId: string)** - Matches a sell order with a buy order.
5. **mintToken(token: Asset, amount: string)** - Mints the specified amount of a token.
6. **fetchMarkets(limit: number)** - Retrieves a list of markets up to the specified limit.
7. **fetchMarketPrice(baseToken: Asset)** - Fetches the current market price for a given market token.
8. **fetchOrders(params: FetchOrdersParams)** - Fetches orders based on the specified parameters.
9. **fetchTrades(params: FetchTradesParams)** - Retrieves trades for markets based on provided parameters.
10. **fetchVolume()** - Retrieves the trading volume for markets.
11. **fetchOrderById(orderId: string)** - Retrieves details of a specific order by its ID.
12. **fetchWalletBalance(asset: Asset)** - Fetches the balance of a specified asset in the wallet.
13. **getProviderWallet()** - Retrieves the wallet associated with the provider.
14. **getProvider()** - Retrieves the provider used by the library.


## Contributing

Contributions to improve the spark-orderbook-ts-sdk are welcome. Please feel free to fork the repository, make your changes, and submit a pull request.
