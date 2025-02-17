import { gql, QueryOptions } from "@apollo/client";
import { generateWhereFilter } from "src/utils/generateWhereFilter";

import { GetActiveOrdersParams, GetOrdersParams, GetOrdersSort } from "..";

export const getOrdersQuery = (
  type: "query" | "subscription",
  params: GetOrdersParams,
  orderBy: GetOrdersSort = {},
): QueryOptions => {
  const { limit, orderType, offset, ...restParams } = params;
  const offsetInRange = offset ?? 0;

  const query = gql`
    ${type} OrderQuery(
      $limit: Int!
      $offset: Int!
      $where: Order_bool_exp
      $orderBy: [Order_order_by!]
    ) {
      Order(limit: $limit, offset: $offset, where: $where, order_by: $orderBy) {
        id
        asset
        amount
        initialAmount
        orderType
        price
        status
        user
        timestamp
        market
      }
    }
  `;

  return {
    query,
    variables: {
      limit,
      offset: offsetInRange,
      where: generateWhereFilter({ ...restParams, orderType }),
      orderBy,
    },
  };
};

export const getActiveOrdersQuery = (
  type: "query" | "subscription",
  params: GetActiveOrdersParams,
  orderBy?: GetOrdersSort,
): QueryOptions => {
  const { limit, orderType, offset, ...restParams } = params;
  const queryObject = `Active${orderType}Order`;
  const offsetInRange = offset ?? 0;
  const query = gql`
    ${type} ${queryObject}Query(
      $limit: Int!
      $offset: Int!
      $where: ${queryObject}_bool_exp
      $orderBy: [${queryObject}_order_by!]
    ) {
      ${queryObject}(limit: $limit, offset: $offset, where: $where, order_by: $orderBy) {
        id
        asset
        amount
        initialAmount
        orderType
        price
        status
        user
        timestamp
        market
      }
    }
  `;

  return {
    query,
    variables: {
      limit,
      offset: offsetInRange,
      where: generateWhereFilter({ ...restParams, orderType }),
      orderBy,
    },
  };
};

export const getLastTradeQuery = (params: GetOrdersParams): QueryOptions => {
  const { limit, ...restParams } = params;
  const timestamp = "desc";
  const query = gql`
    query TradeOrderEvent(
      $limit: Int!
      $where: TradeOrderEvent_bool_exp
      $timestamp: order_by!
    ) {
      TradeOrderEvent(
        limit: $limit
        where: $where
        order_by: { timestamp: $timestamp }
      ) {
        tradePrice
      }
    }
  `;

  return {
    query,
    variables: {
      limit,
      where: generateWhereFilter({ ...restParams }),
      timestamp,
    },
  };
};
