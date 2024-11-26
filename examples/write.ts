import { Wallet } from "fuels";

import SparkOrderbook, { Asset, OrderType } from "../src";

import {
  DEFAULT_AMOUNT,
  DEFAULT_TOKEN,
  initializeSparkOrderbook,
} from "./utils";

// ⚠️ NEVER SHARE YOUR PRIVATE KEY WITH ANYONE ⚠️
const PRIVATE_KEY = ""; // ⚠️ NEVER SHARE YOUR PRIVATE KEY WITH ANYONE ⚠️
// ⚠️ NEVER SHARE YOUR PRIVATE KEY WITH ANYONE ⚠️

// For each write operation, you need a wallet with a sufficient amount of ETH to send transactions.
async function main() {
  const wallet = Wallet.fromPrivateKey(PRIVATE_KEY);
  const spark = await initializeSparkOrderbook(wallet);

  await mint(spark, DEFAULT_TOKEN, DEFAULT_AMOUNT);

  await deposit(spark, DEFAULT_TOKEN, DEFAULT_AMOUNT);

  const price = "7000000000000"; // $70,000
  await createOrder(spark, DEFAULT_AMOUNT, price, OrderType.Buy);

  // Retrieve orderId from fetchOrders, filtered by user
  // const orderId = '';
  // await cancelOrder(spark, orderId);
}

function mint(spark: SparkOrderbook, token: Asset, amount: string) {
  return spark.mintToken(token, amount);
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

function cancelOrder(spark: SparkOrderbook, orderId: string) {
  return spark.cancelOrder(orderId);
}

main();
