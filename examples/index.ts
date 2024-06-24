import { Provider, Wallet } from "fuels";

import SparkOrderbook, {
  BETA_CONTRACT_ADDRESSES,
  TESTNET_INDEXER_URL,
  TESTNET_NETWORK,
} from "../src";

const provider = await Provider.create(TESTNET_NETWORK.url);

const TEST_PRIVATE_KEY = "";

const wallet = Wallet.fromPrivateKey(TEST_PRIVATE_KEY, provider);

const spark = new SparkOrderbook({
  networkUrl: TESTNET_NETWORK.url,
  contractAddresses: BETA_CONTRACT_ADDRESSES,
  indexerApiUrl: TESTNET_INDEXER_URL,
  wallet,
});

spark.fetchMarkets(1).then(console.log);
