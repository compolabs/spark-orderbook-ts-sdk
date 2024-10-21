type ComparisonOperator = {
  _eq?: any;
};

type Condition = {
  [key: string]: ComparisonOperator;
};

interface WhereFilter {
  [key: string]: ComparisonOperator | Condition[] | undefined;
  _or?: Condition[];
}

export const generateWhereFilter = (
  params: Record<string, any>,
): WhereFilter => {
  const where: WhereFilter = {};

  for (const key in params) {
    const value = params[key];

    if (Array.isArray(value) && value.length) {
      if (value.length === 1) {
        where[key] = { _eq: value[0] };
      } else {
        const orConditions = value.map((v) => ({
          [key]: { _eq: v },
        }));

        if (where._or) {
          where._or = where._or.concat(orConditions);
        } else {
          where._or = orConditions;
        }
      }
    } else if (value) {
      where[key] = { _eq: value };
    }
  }

  return where;
};
