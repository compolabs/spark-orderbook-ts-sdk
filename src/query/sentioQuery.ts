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
                  pnl1, pnl7, pnl31, user, market, pnlChangedTimestamp AS timestamp
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
              SUM(pnl1) AS total_pnl1,
              SUM(pnl7) AS total_pnl7,
              SUM(pnl31) AS total_pnl31
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
    excluded,
  }: GetUserPointQueryParams): Promise<GetSentioResponse<UserPointsResponse>> {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `
          SELECT 
          (
            (
              SELECT 
                SUM(volume) 
              FROM 
                TradeEvent 
              WHERE 
                (
                  seller = '${userAddress}' 
                  OR buyer = '${userAddress}'
                ) 
                AND timestamp BETWEEN ${fromTimestamp} 
                AND ${toTimestamp}
            ) / (
              SELECT 
                SUM(volume) 
              FROM 
                TradeEvent 
              WHERE 
                seller NOT IN (
                  ${excluded.join(",")}
                ) 
                AND buyer NOT IN (
                  ${excluded.join(",")}
                )
            )
          ) * 400000 AS result
        `,
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
          FROM Balance_raw
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
                  ROW_NUMBER() OVER (ORDER BY SUM(pnlComp1) DESC) AS position
              FROM Balance
              GROUP BY user
              HAVING SUM(pnlComp1) != 0
          ),
          UserVolumes AS (
              SELECT
                  t.buyer AS user,
                  SUM(CASE WHEN t.seller = t.buyer THEN t.volume ELSE 0 END) + 
                  SUM(CASE WHEN t.buyer = t.buyer THEN t.volume ELSE 0 END) AS total_volume
              FROM TradeEvent t
              GROUP BY t.buyer
          )
          SELECT rd.*, uv.total_volume
          FROM RankedData rd
          LEFT JOIN UserVolumes uv ON rd.user = uv.user
          WHERE rd.user ILIKE '%' || '${search}' || '%'
            AND uv.total_volume > 4000
          ORDER BY rd.total_pnlComp1 ${side}
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
