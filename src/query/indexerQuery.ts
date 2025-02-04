import { gql, QueryOptions } from "@apollo/client";
import { generateWhereFilter } from "src/utils/generateWhereFilter";

import { GetActiveOrdersParams, GetOrdersParams } from "..";

export const getOrdersQuery = (
  type: "query" | "subscription",
  params: GetOrdersParams,
): QueryOptions => {
  const { limit, orderType, offset, ...restParams } = params;
  const priceOrder = orderType === "Buy" ? "desc" : "asc";
  const offsetInRange = offset ?? 0;
  const query = gql`
    ${type} OrderQuery(
      $limit: Int!
      $offset: Int!
      $where: Order_bool_exp
      $priceOrder: order_by!
    ) {
      Order(limit: $limit, offset: $offset, where: $where, order_by: { price: $priceOrder }) {
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
      priceOrder,
    },
  };
};

export const getActiveOrdersQuery = (
  type: "query" | "subscription",
  params: GetActiveOrdersParams,
): QueryOptions => {
  const { limit, orderType, offset, ...restParams } = params;
  const priceOrder = orderType === "Buy" ? "desc" : "asc";
  const queryObject = `Active${orderType}Order`;
  const offsetInRange = offset ?? 0;
  const query = gql`
    ${type} ${queryObject}Query(
      $limit: Int!
      $offset: Int!
      $where: ${queryObject}_bool_exp
      $priceOrder: order_by!
    ) {
      ${queryObject}(limit: $limit, offset: $offset, where: $where, order_by: { price: $priceOrder }) {
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
      priceOrder,
    },
  };
};

export const getLastTradeQuery = (params: GetOrdersParams): QueryOptions => {
  const { limit, ...restParams } = params;
  const query = gql`
    query OrderQuery($limit: Int!, $where: TradeOrderEvent_bool_exp) {
      TradeOrderEvent(limit: $limit, where: $where) {
        tradePrice
      }
    }
  `;

  return {
    query,
    variables: {
      limit,
      where: generateWhereFilter({ ...restParams }),
    },
  };
};
