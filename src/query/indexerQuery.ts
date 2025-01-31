import { gql, QueryOptions } from "@apollo/client";
import { generateWhereFilter } from "src/utils/generateWhereFilter";

import { GetActiveOrdersParams, GetOrdersParams } from "..";

export const getOrdersQuery = (
  type: "query" | "subscription",
  params: GetOrdersParams,
): QueryOptions => {
  const { limit, offset, ...restParams } = params;
  const offsetInRange = offset ?? 0;

  const query = gql`
    ${type} OrderQuery(
      $limit: Int!
      $offset: Int!
      $where: Order_bool_exp
    ) {
      Order(limit: $limit, offset: $offset, where: $where) {
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
      where: generateWhereFilter(restParams),
    },
  };
};

export const getActiveOrdersQuery = (
  type: "query" | "subscription",
  params: GetActiveOrdersParams,
): QueryOptions => {
  const { limit, orderType, offset, ...restParams } = params;
  const queryObject = `Active${orderType}Order`;
  const offsetInRange = offset ?? 0;

  const query = gql`
    ${type} ${queryObject}Query(
      $limit: Int!
      $offset: Int!
      $where: ${queryObject}_bool_exp
    ) {
      ${queryObject}(limit: $limit, offset: $offset, where: $where) {
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
    },
  };
};
