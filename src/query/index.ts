import { gql, QueryOptions } from "@apollo/client";

import { GetActiveOrdersParams, GetOrdersParams } from "..";

export const getOrdersQuery = (
  type: "query" | "subscription",
  params: GetOrdersParams,
): QueryOptions => {
  const generateWhereFilter = (params: GetOrdersParams) => {
    const where: any = {};

    if (params.orderType) {
      where.order_type = { _eq: params.orderType };
    }

    if (params.status?.length) {
      if (params.status.length > 1) {
        where._or = params.status.map((status: string) => ({
          status: { _eq: status },
        }));
      } else {
        where.status = { _eq: params.status[0] };
      }
    }

    if (params.user) {
      where.user = { _eq: params.user };
    }

    if (params.asset) {
      where.asset = { _eq: params.asset };
    }

    return where;
  };

  const priceOrder = params.orderType === "Buy" ? "desc" : "asc";

  const query = gql`
    ${type} OrderQuery(
      $limit: Int!
      $where: Order_bool_exp
      $priceOrder: order_by!
    ) {
      Order(limit: $limit, where: $where, order_by: { price: $priceOrder }) {
        id
        asset
        asset_type
        amount
        initial_amount
        order_type
        price
        status
        user
        timestamp
      }
    }
  `;

  return {
    query,
    variables: {
      limit: params.limit,
      where: generateWhereFilter(params),
      priceOrder,
    },
  };
};

export const getActiveOrdersQuery = (
  type: "query" | "subscription",
  params: GetActiveOrdersParams,
): QueryOptions => {
  const generateWhereFilter = (params: GetActiveOrdersParams) => {
    const where: any = {};

    if (params.orderType) {
      where.order_type = { _eq: params.orderType };
    }

    if (params.user) {
      where.user = { _eq: params.user };
    }

    if (params.asset) {
      where.asset = { _eq: params.asset };
    }

    return where;
  };

  const priceOrder = params.orderType === "Buy" ? "desc" : "asc";
  const queryObject = `Active${params.orderType}Order`;

  const query = gql`
    ${type} ${queryObject}Query(
      $limit: Int!
      $where: ${queryObject}_bool_exp
      $priceOrder: order_by!
    ) {
      ${queryObject}(limit: $limit, where: $where, order_by: { price: $priceOrder }) {
        id
        asset
        amount
        initial_amount
        order_type
        price
        status
        user
        timestamp
      }
    }
  `;

  return {
    query,
    variables: {
      limit: params.limit,
      where: generateWhereFilter(params),
      priceOrder,
    },
  };
};
