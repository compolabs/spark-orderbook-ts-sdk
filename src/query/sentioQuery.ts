import {
  GetCompetitionParams,
  GetCompetitionResponse,
  GetLeaderboardPnlQueryParams,
  GetLeaderboardQueryParams,
  GetSentioResponse,
  GetSortedLeaderboardPnlQueryParams,
  GetSortedLeaderboardQueryParams,
  GetTotalStatsResponse,
  GetTotalStatsTableData,
  GetTotalStatsTableDataParams,
  GetTradeEventQueryParams,
  GetUserPointQueryParams,
  GetUserScoreSnapshotParams,
  LeaderboardPnlResponse,
  RowSnapshot,
  RowTradeEvent,
  SentioApiParams,
  TraderVolumeResponse,
  UserPointsResponse,
} from "src/interface";
import { Fetch } from "src/utils/Fetch";

interface sqlQueryParams {
  sqlQuery: {
    sql: string;
    size: number;
  };
}

export class SentioQuery extends Fetch {
  private readonly apiKey: string;

  constructor({ url, apiKey }: SentioApiParams) {
    super(url);
    this.apiKey = apiKey;
  }

  async getSortedLeaderboardPnlQuery({
    side,
    timeline,
    limit,
    page,
  }: GetSortedLeaderboardPnlQueryParams): Promise<
    GetSentioResponse<LeaderboardPnlResponse>
  > {
    const offset = page * limit;
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `WITH latest_market_data AS (
              SELECT 
                  pnlInPersent1, pnlInPersent7, pnlInPersent31, user, market, pnlChangedTimestamp AS timestamp
              FROM (
                  SELECT *,
                      ROW_NUMBER() OVER (PARTITION BY user, market ORDER BY pnlChangedTimestamp DESC) AS rn
                  FROM Balance_raw
              ) t
              WHERE rn = 1
          )
          SELECT 
              user,
              SUM(pnlInPersent1) AS total_pnl1,
              SUM(pnlInPersent7) AS total_pnl7,
              SUM(pnlInPersent31) AS total_pnl31
          FROM latest_market_data
          GROUP BY user
          ORDER BY ${timeline} ${side}
          LIMIT ${limit} OFFSET ${offset};
          `,
        size: 20,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<LeaderboardPnlResponse>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getLeaderboardPnlQuery({
    wallets,
  }: GetLeaderboardPnlQueryParams): Promise<
    GetSentioResponse<LeaderboardPnlResponse>
  > {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `WITH latest_market_data AS (
              SELECT 
                  pnlInPersent1, pnlInPersent7, pnlInPersent31, user, market, pnlChangedTimestamp AS timestamp
              FROM (
                  SELECT *,
                      ROW_NUMBER() OVER (PARTITION BY user, market ORDER BY pnlChangedTimestamp DESC) AS rn
                  FROM Balance_raw
                  WHERE user IN (${wallets.map((wallet) => `'${wallet}'`).join(", ")})
              ) t
              WHERE rn = 1
          )
          SELECT 
              user,
              SUM(pnlInPersent1) AS total_pnl1,
              SUM(pnlInPersent7) AS total_pnl7,
              SUM(pnlInPersent31) AS total_pnl31
          FROM latest_market_data
          GROUP BY user
          `,
        size: 1000,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<LeaderboardPnlResponse>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getLeaderboardQuery({
    page,
    limit,
    currentTimestamp,
    interval,
    side,
    wallets,
  }: GetLeaderboardQueryParams): Promise<
    GetSentioResponse<TraderVolumeResponse>
  > {
    const offset = page * limit;
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `WITH Combined AS (
              SELECT
                  seller AS walletId,
                  volume,
                  timestamp
              FROM TradeEvent
              WHERE timestamp BETWEEN ${currentTimestamp} - ${interval} AND ${currentTimestamp}
              UNION ALL
              SELECT
                  buyer AS walletId,
                  volume,
                  timestamp
              FROM TradeEvent
              WHERE timestamp BETWEEN ${currentTimestamp} - ${interval} AND ${currentTimestamp}
          ),
          Ranked AS (
              SELECT
                  walletId,
                  SUM(volume) AS traderVolume,
                  ROW_NUMBER() OVER (ORDER BY SUM(volume) DESC) AS id
              FROM Combined
              GROUP BY walletId
          ),
          Filtered AS (
              SELECT
                  id,
                  walletId,
                  traderVolume,
                  COUNT(*) OVER () AS totalCount
              FROM Ranked
              WHERE walletId IN (${wallets.map((wallet) => `'${wallet}'`).join(", ")}
              )
          )
          SELECT
              id,
              walletId,
              traderVolume,
              totalCount
          FROM Filtered
          ORDER BY traderVolume ${side}
          LIMIT ${limit} OFFSET ${offset};`,
        size: limit,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<TraderVolumeResponse>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getSortedLeaderboardQuery({
    page,
    search = "",
    limit,
    currentTimestamp,
    interval,
    side,
  }: GetSortedLeaderboardQueryParams): Promise<
    GetSentioResponse<TraderVolumeResponse>
  > {
    const offset = page * limit;
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `WITH Combined AS (
              SELECT 
                  seller AS walletId,
                  volume,
                  timestamp
              FROM TradeEvent
              WHERE timestamp BETWEEN ${currentTimestamp} - ${interval} AND ${currentTimestamp}
              UNION ALL
              SELECT 
                  buyer AS walletId,
                  volume,
                  timestamp
              FROM TradeEvent
              WHERE timestamp BETWEEN ${currentTimestamp} - ${interval} AND ${currentTimestamp}
          ),
          Ranked AS (
              SELECT 
                  walletId,
                  SUM(volume) AS traderVolume,
                  ROW_NUMBER() OVER (ORDER BY SUM(volume) DESC) AS id
              FROM Combined
              GROUP BY walletId
          ),
          Filtered AS (
              SELECT 
                  id,
                  walletId,
                  traderVolume,
                  COUNT(*) OVER () AS totalCount
              FROM Ranked
              WHERE walletId LIKE '%${search}%'
          )
          SELECT 
              id,
              walletId,
              traderVolume,
              totalCount
          FROM Filtered
          ORDER BY traderVolume ${side}
          LIMIT ${limit} OFFSET ${offset};`,
        size: limit,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<TraderVolumeResponse>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getUserPoints({
    userAddress,
    fromTimestamp,
    toTimestamp,
  }: GetTradeEventQueryParams): Promise<GetSentioResponse<UserPointsResponse>> {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `SELECT (
          (SELECT SUM(volume)
            FROM TradeEvent
              WHERE
                (seller = '${userAddress}'
                OR buyer = '${userAddress}')
                AND timestamp BETWEEN '${fromTimestamp}' AND '${toTimestamp}'
          ) /
          (SELECT SUM(volume) FROM TradeEvent
            WHERE seller NOT IN (
              '0x1389cb25c66e55525b35f5c57c2f773ab953b80f396e503b6a55ed43707c4e0c',
              '0xeb0dd9331390a24aa49bd0cf21c5d2127661c68ff38b614afdf41d4e59db5c37',
              '0xd8962a0f26cf184ae35023e03cde4937cb6c0383be5ccc4e9aca73fe013928c0',
              '0x210ec7f9fc740e5c6a06eab9134be3a73a7fd6a75f4a9b12c93436c9acbfc3bd',
              '0xae519546161aa3d969092716f617dd1465f0ba76acdd91b2a9d6e51fd01a8ac5',
              '0xfc07190ea30c0c308e8b552bdba73dd3abc30c60c00efbb048671fb8c55a97c3',
              '0x6d0f1faf235cc8d159479ce436d02d6bea21e4579b619c47c7d1810237710d8c'
              ) 
              AND buyer NOT IN (
              '0x1389cb25c66e55525b35f5c57c2f773ab953b80f396e503b6a55ed43707c4e0c',
              '0xeb0dd9331390a24aa49bd0cf21c5d2127661c68ff38b614afdf41d4e59db5c37',
              '0xd8962a0f26cf184ae35023e03cde4937cb6c0383be5ccc4e9aca73fe013928c0',
              '0x210ec7f9fc740e5c6a06eab9134be3a73a7fd6a75f4a9b12c93436c9acbfc3bd',
              '0xae519546161aa3d969092716f617dd1465f0ba76acdd91b2a9d6e51fd01a8ac5',
              '0xfc07190ea30c0c308e8b552bdba73dd3abc30c60c00efbb048671fb8c55a97c3',
              '0x6d0f1faf235cc8d159479ce436d02d6bea21e4579b619c47c7d1810237710d8c'
              )
            )
          ) * 400000 AS result;`,
        size: 10,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<UserPointsResponse>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getUserScoreSnapshotQuery({
    userAddress,
    fromTimestamp,
    toTimestamp,
  }: GetUserScoreSnapshotParams): Promise<GetSentioResponse<RowSnapshot>> {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `SELECT 
          DATE_TRUNC('hour', toDateTime(timestamp)) AS hour,
          ARRAY_AGG(
              CONCAT(
                  '{',
                  '"user": "', user, '", ',
                  '"market": "', market, '", ',
                  '"tvl": ', tvl, ', ',
                  '"timestamp": ', timestamp,
                  '}'
              )
          ) AS records_in_hour
          FROM prod_subgraph.SqgyBNQS_view_Balance AS Balance_raw 
          WHERE user = '${userAddress}'
              AND timestamp >= '${fromTimestamp}' 
              AND timestamp <= '${toTimestamp}'
          GROUP BY hour
          ORDER BY hour ASC 
          LIMIT 10000;
      `,
        size: 10000,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<RowSnapshot>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getTradeEventQuery({
    userAddress,
    fromTimestamp,
    toTimestamp,
  }: GetTradeEventQueryParams): Promise<GetSentioResponse<RowTradeEvent>> {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `SELECT * 
          FROM TradeEvent 
          WHERE (seller = '${userAddress}'
                 OR buyer = '${userAddress}')
            AND timestamp >= '${fromTimestamp}' 
            AND timestamp <= '${toTimestamp}';
          `,
        size: 1000,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<RowTradeEvent>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getTotalStats(): Promise<GetSentioResponse<GetTotalStatsResponse>> {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `SELECT 
            SUM(volume) AS total_volume, 
            COUNT(*) AS total_trades 
         FROM TradeEvent;
        `,
        size: 10,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<GetTotalStatsResponse>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getCompetition({
    side,
    limit,
    page,
    search = "",
  }: GetCompetitionParams): Promise<GetSentioResponse<GetCompetitionResponse>> {
    const offset = page * limit;
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `WITH RankedData AS (
              SELECT 
                  user, 
                  SUM(pnlComp1) AS total_pnlComp1, 
                  SUM(quoteAmount) AS total_quoteAmount,
                  ROW_NUMBER() OVER (ORDER BY SUM(pnlComp1) DESC) AS position,
                  CONCAT('[', 
                        arrayStringConcat(
                            arrayMap(x -> concat('{"market": "', x.1, '", "pnlComp1": ', toString(x.2), '}'), 
                                      groupArray((market, pnlComp1))),
                            ','
                        ), 
                        ']') AS data
              FROM prod_subgraph.WCCjGDWY_latestView_Balance AS Balance
              GROUP BY user
              HAVING SUM(pnlComp1) != 0
          )
          SELECT * 
          FROM RankedData
          WHERE user ILIKE '%' || '${search}' || '%'
          ORDER BY total_pnlComp1 ${side}
          LIMIT ${limit} OFFSET ${offset};
        `,
        size: 10,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<GetCompetitionResponse>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }

  async getTotalStatsTableData({
    side,
  }: GetTotalStatsTableDataParams): Promise<
    GetSentioResponse<GetTotalStatsTableData>
  > {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `WITH LastPrices AS (
                  SELECT market, price AS last_price
                  FROM TradeEvent
                  QUALIFY ROW_NUMBER() OVER (PARTITION BY market ORDER BY timestamp DESC) = 1
              ),  
              Price24hAgo AS (
                  SELECT DISTINCT ON (market) market, price AS price_24h_ago
                  FROM TradeEvent
                  WHERE timestamp >= (now() - INTERVAL 1 DAY)
                  ORDER BY market, timestamp ASC
              )

              SELECT t.market AS market,
                    SUM(CASE WHEN t.timestamp >= (now() - INTERVAL 1 DAY) THEN t.volume ELSE 0 END) AS total_volume_24h,
                    SUM(CASE WHEN t.timestamp >= (now() - INTERVAL 7 DAY) THEN t.volume ELSE 0 END) AS total_volume_7d,
                    lp.last_price,
                    COALESCE(p24.price_24h_ago, lp.last_price) AS price_24h_ago,
                    (lp.last_price - COALESCE(p24.price_24h_ago, lp.last_price)) AS price_change_24h
              FROM TradeEvent t
              LEFT JOIN LastPrices lp ON t.market = lp.market
              LEFT JOIN Price24hAgo p24 ON t.market = p24.market
              WHERE t.timestamp >= (now() - INTERVAL 7 DAY)
              GROUP BY t.market, lp.last_price, p24.price_24h_ago
              ORDER BY total_volume_24h ${side};
        `,
        size: 10,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetSentioResponse<GetTotalStatsTableData>>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }
}

export const getUserScoreSnapshotQuery = async (
  props: GetUserScoreSnapshotParams & SentioApiParams,
): Promise<GetSentioResponse<RowSnapshot>> => {
  const { url, apiKey } = props;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getUserScoreSnapshotQuery({
    ...props,
  });
};

export const getTradeEventQuery = async (
  props: GetTradeEventQueryParams & SentioApiParams,
): Promise<GetSentioResponse<RowTradeEvent>> => {
  const { url, apiKey } = props;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getTradeEventQuery({
    ...props,
  });
};

export const getSortedLeaderboardQuery = async (
  params: GetSortedLeaderboardQueryParams & SentioApiParams,
): Promise<GetSentioResponse<TraderVolumeResponse>> => {
  const { url, apiKey } = params;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getSortedLeaderboardQuery({
    ...params,
  });
};

export const getLeaderboardQuery = async (
  params: GetLeaderboardQueryParams & SentioApiParams,
): Promise<GetSentioResponse<TraderVolumeResponse>> => {
  const { url, apiKey } = params;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getLeaderboardQuery({
    ...params,
  });
};

export const getLeaderboardPnlQuery = async (
  params: GetLeaderboardPnlQueryParams & SentioApiParams,
): Promise<GetSentioResponse<LeaderboardPnlResponse>> => {
  const { url, apiKey } = params;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getLeaderboardPnlQuery({
    ...params,
  });
};

export const getSortedLeaderboardPnlQuery = async (
  params: GetSortedLeaderboardPnlQueryParams & SentioApiParams,
): Promise<GetSentioResponse<LeaderboardPnlResponse>> => {
  const { url, apiKey } = params;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getSortedLeaderboardPnlQuery({
    ...params,
  });
};

export const getUserPointsQuery = async (
  params: GetUserPointQueryParams & SentioApiParams,
): Promise<GetSentioResponse<UserPointsResponse>> => {
  const { url, apiKey } = params;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getUserPoints({
    ...params,
  });
};

export const getTotalStatsQuery = async (
  props: SentioApiParams,
): Promise<GetSentioResponse<GetTotalStatsResponse>> => {
  const { url, apiKey } = props;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getTotalStats();
};

export const getTotalStatsTableDataQuery = async (
  props: GetTotalStatsTableDataParams & SentioApiParams,
): Promise<GetSentioResponse<GetTotalStatsTableData>> => {
  const { url, apiKey } = props;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getTotalStatsTableData({ ...props });
};

export const getCompetitionQuery = async (
  props: GetCompetitionParams & SentioApiParams,
): Promise<GetSentioResponse<GetCompetitionResponse>> => {
  const { url, apiKey } = props;
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getCompetition({ ...props });
};
