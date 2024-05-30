import { Provider, Wallet } from "fuels";

import SparkOrderbook, {
  BETA_CONTRACT_ADDRESSES,
  BETA_INDEXER_URL,
  BETA_NETWORK,
} from "../src";

const provider = await Provider.create(BETA_NETWORK.url);

const TEST_PRIVATE_KEY = "";

const wallet = Wallet.fromPrivateKey(TEST_PRIVATE_KEY, provider);

const spark = new SparkOrderbook({
  networkUrl: BETA_NETWORK.url,
  contractAddresses: BETA_CONTRACT_ADDRESSES,
  indexerApiUrl: BETA_INDEXER_URL,
  wallet,
});

spark.fetchSpotMarkets(1).then(console.log);
