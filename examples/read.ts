import SparkOrderbook, { OrderType } from "../src/index";

import { DEFAULT_MARKET, initializeSparkOrderbook } from "./utils";

async function main() {
  const spark = await initializeSparkOrderbook();

  // Subscriptions
  // ⚠️⚠️⚠️ This works only in React ⚠️⚠️⚠️
  // subscribeActiveOrders(spark, OrderType.Buy, [DEFAULT_MARKET], 10);
  // subscribeActiveOrders(spark, OrderType.Sell, [DEFAULT_MARKET], 10);
  // subscribeAllOrders(spark, 10);
  // subscribeTradeEvents(spark, [DEFAULT_MARKET], 10);

  // Fetch requests
  await fetchAllOrders(spark, 10);
  await fetchActiveOrders(spark, OrderType.Buy, [DEFAULT_MARKET], 10);
  await fetchActiveOrders(spark, OrderType.Sell, [DEFAULT_MARKET], 10);
  await fetchTradeVolume(spark);

  // await fetchOrdersForUser(spark, 10, '0x00000'); <- Request to retrieve all transactions for a user

  // For other requests, check the function arguments; there are many filters you can use.
}

// Subscription for active orders by type
function subscribeActiveOrders(
  spark: SparkOrderbook,
  orderType: OrderType,
  market: string[],
  limit: number,
) {
  const subscription = spark.subscribeActiveOrders<any>({
    limit,
    orderType,
    market,
  });
  subscription.subscribe((data: any) =>
    console.log(
      `subscribeActiveOrders - ${orderType}`,
      orderType === OrderType.Buy
        ? data.data?.ActiveBuyOrder
        : data.data?.ActiveSellOrder,
      "\n",
    ),
  );
}

// Subscription to all orders
function subscribeAllOrders(spark: SparkOrderbook, limit: number) {
  const allOrdersSubscription = spark.subscribeOrders({ limit });
  allOrdersSubscription.subscribe((data) =>
    console.log(`subscribeAllOrders`, data.data?.Order, "\n"),
  );
}

// Subscription to trade events
function subscribeTradeEvents(
  spark: SparkOrderbook,
  market: string[],
  limit: number,
) {
  const tradeEventsSubscription = spark.subscribeTradeOrderEvents({
    limit,
    market,
  });
  tradeEventsSubscription.subscribe((data) =>
    console.log(`subscribeTradeEvents`, data.data?.TradeOrderEvent, "\n"),
  );
}

// Fetch all orders
async function fetchAllOrders(spark: SparkOrderbook, limit: number) {
  const orders = await spark.fetchOrders({ limit });
  console.log(`fetchAllOrders`, orders.data?.Order, "\n");
}

// Fetch all orders for specific user
async function fetchOrdersForUser(
  spark: SparkOrderbook,
  limit: number,
  user: string,
) {
  const orders = await spark.fetchOrders({ limit, user });
  console.log(`fetchOrdersForUser`, orders.data?.Order, "\n");
}

// Fetch active orders by type
async function fetchActiveOrders(
  spark: SparkOrderbook,
  orderType: OrderType,
  market: string[],
  limit: number,
) {
  const activeOrders: any = await spark.fetchActiveOrders<any>({
    limit,
    market,
    orderType,
  });
  console.log(
    `fetchActiveOrders - ${orderType}`,
    orderType === OrderType.Buy
      ? activeOrders.data?.ActiveBuyOrder
      : activeOrders.data?.ActiveSellOrder,
    "\n",
  );
}

// Fetch trade volume
async function fetchTradeVolume(spark: SparkOrderbook) {
  const volume = await spark.fetchVolume({
    limit: 100,
    market: [DEFAULT_MARKET],
  });
  console.log(`volume`, volume, "\n");
}

main();
