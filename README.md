
# spark-ts-sdk

> [!IMPORTANT]
> Please note that the current version of the Spark SDK is a beta release. This version is still under active development and may not be stable. Users should expect frequent updates and changes as we work to improve functionality and address issues. As a beta product, this version is intended for testing and feedback purposes only. We encourage users to provide feedback as it will help us refine and enhance the SDK in preparation for a more stable release.

## Introduction

The spark-ts-sdk is a comprehensive solution for interacting with financial markets, offering both spot and perpetual trading functionality. It's built on the Fuels platform, utilizing smart contracts for decentralized transaction processing. This library provides easy-to-use methods for creating and managing orders, handling tokens, and retrieving market data.

## Installation
To install the spark-ts-sdk, follow these steps:

```bash
npm i spark-ts-sdk
```

## Usage

To use the spark-ts-sdk, you'll need to set up a `Spark` instance with the appropriate configuration:

```typescript
import Spark, { BETA_NETWORK, BETA_CONTRACT_ADDRESSES, BETA_INDEXER_URL } from "spark-ts-sdk";

// Create a wallet instance
const provider = await Provider.create(BETA_NETWORK.url);
const wallet = Wallet.fromPrivateKey(/* PRIVATE KEY */, provider);

const spark = new Spark({
  networkUrl: BETA_NETWORK.url,
  contractAddresses: BETA_CONTRACT_ADDRESSES,
  indexerApiUrl: BETA_INDEXER_URL,
  wallet,
});
// Now you can use `spark` to interact with the library methods
```

## Available Methods

Below is a list of all the available methods in the spark-ts-sdk. These methods enable interaction with spot and perpetual markets:

1. **setActiveWallet(wallet?: WalletLocked | WalletUnlocked)** - Updates the active wallet used in the library.
2. **createSpotOrder(baseToken: Asset, quoteToken: Asset, size: string, price: string)** - Creates a spot order with the specified parameters.
3. **cancelSpotOrder(orderId: string)** - Cancels a specified spot order.
4. **matchSpotOrders(sellOrderId: string, buyOrderId: string)** - Matches a sell order with a buy order.
5. **mintToken(token: Asset, amount: string)** - Mints the specified amount of a token.
6. **depositPerpCollateral(asset: Asset, amount: string)** - Deposits collateral for perpetual contracts.
7. **withdrawPerpCollateral(baseToken: Asset, gasToken: Asset, amount: string, oracleUpdateData: string[])** - Withdraws collateral from perpetual contracts.
8. **openPerpOrder(baseToken: Asset, gasToken: Asset, amount: string, price: string, updateData: string[])** - Opens a new perpetual order.
9. **removePerpOrder(assetId: string)** - Removes a perpetual order.
10. **fulfillPerpOrder(gasToken: Asset, orderId: string, amount: string, updateData: string[])** - Fulfills an open perpetual order.
11. **fetchSpotMarkets(limit: number)** - Retrieves a list of spot markets up to the specified limit.
12. **fetchSpotMarketPrice(baseToken: Asset)** - Fetches the current market price for a given spot market token.
13. **fetchSpotOrders(params: FetchOrdersParams)** - Fetches spot orders based on the specified parameters.
14. **fetchSpotTrades(params: FetchTradesParams)** - Retrieves trades for spot markets based on provided parameters.
15. **fetchSpotVolume()** - Retrieves the trading volume for spot markets.
16. **fetchSpotOrderById(orderId: string)** - Retrieves details of a specific spot order by its ID.
17. **fetchPerpCollateralBalance(accountAddress: string, asset: Asset)** - Checks the collateral balance for a given account in perpetual markets.
18. **fetchPerpAllTraderPositions(accountAddress: string)** - Fetches all positions for a trader in perpetual markets.
19. **fetchPerpIsAllowedCollateral(asset: Asset)** - Determines if a specific asset is allowed as collateral in perpetual markets.
20. **fetchPerpTraderOrders(accountAddress: string, asset: Asset)** - Fetches orders for a trader in perpetual markets.
21. **fetchPerpAllMarkets(assetList: Asset[], quoteAsset: Asset)** - Fetches all perpetual markets for specified assets.
22. **fetchPerpFundingRate(asset: Asset)** - Fetches the funding rate for a given asset in perpetual markets.
23. **fetchPerpMaxAbsPositionSize(accountAddress: string, asset: Asset, tradePrice: string)** - Retrieves the maximum absolute position size for a trader in perpetual markets.
24. **fetchPerpPendingFundingPayment(accountAddress: string, asset: Asset)** - Fetches pending funding payments for a trader.
25. **fetchPerpMarkPrice(asset: Asset)** - Retrieves the mark price for a given asset in perpetual markets.
26. **fetchWalletBalance(asset: Asset)** - Fetches the balance of a specified asset in the wallet.
27. **getProviderWallet()** - Retrieves the wallet associated with the provider.
28. **getProvider()** - Retrieves the provider used by the library.


## Contributing

Contributions to improve the spark-ts-sdk are welcome. Please feel free to fork the repository, make your changes, and submit a pull request.
