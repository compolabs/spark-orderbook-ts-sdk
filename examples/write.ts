import { Provider, Wallet } from "fuels";

import SparkOrderbook, { Asset, OrderType } from "../src";

import CONFIG from "./config.json";
import { DEFAULT_AMOUNT, initializeSparkOrderbook } from "./utils";

// ⚠️ NEVER SHARE YOUR PRIVATE KEY WITH ANYONE ⚠️
const PRIVATE_KEY = ""; // ⚠️ NEVER SHARE YOUR PRIVATE KEY WITH ANYONE ⚠️
// ⚠️ NEVER SHARE YOUR PRIVATE KEY WITH ANYONE ⚠️

// For each write operation, you need a wallet with a sufficient amount of ETH to send transactions.
async function main() {
  const provider = new Provider(CONFIG.networkUrl);
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY, provider);
  const spark = await initializeSparkOrderbook(wallet);

  // await deposit(spark, DEFAULT_TOKEN, "50000");

  const price = "1000000000";
  await createOrder(spark, DEFAULT_AMOUNT, price, OrderType.Buy);
}

function deposit(spark: SparkOrderbook, token: Asset, amount: string) {
  return spark.deposit(token, amount);
}

function createOrder(
  spark: SparkOrderbook,
  amount: string,
  price: string,
  type: OrderType,
) {
  return spark.createOrder({
    amount,
    price,
    type,
  });
}

main();
