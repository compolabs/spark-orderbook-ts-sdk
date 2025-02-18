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
          WITH ExcludedUsers AS (
              SELECT '0x1389cb25c66e55525b35f5c57c2f773ab953b80f396e503b6a55ed43707c4e0c' AS user UNION ALL
              SELECT '0xeb0dd9331390a24aa49bd0cf21c5d2127661c68ff38b614afdf41d4e59db5c37' UNION ALL
              SELECT '0xd8962a0f26cf184ae35023e03cde4937cb6c0383be5ccc4e9aca73fe013928c0' UNION ALL
              SELECT '0x210ec7f9fc740e5c6a06eab9134be3a73a7fd6a75f4a9b12c93436c9acbfc3bd' UNION ALL
              SELECT '0xae519546161aa3d969092716f617dd1465f0ba76acdd91b2a9d6e51fd01a8ac5' UNION ALL
              SELECT '0xfc07190ea30c0c308e8b552bdba73dd3abc30c60c00efbb048671fb8c55a97c3' UNION ALL
              SELECT '0x6d0f1faf235cc8d159479ce436d02d6bea21e4579b619c47c7d1810237710d8c' UNION ALL
              SELECT '0x642731ae54ab89722a0a1b5f0e7aac9e323f7aeb7d852709bc17de92e18789f3' UNION ALL
              SELECT '0x1fba609a02f7207c0022d5813e4f406dfe91c18c93d7fb44fbf956dcf0d5b86f' UNION ALL
              SELECT '0x690a1f28c8b5080f7b3dd55eeb4a0d12d0eebad67aaec0c6544c65e4f97d2896' UNION ALL
              SELECT '0x9acaf0ab822be6b2bce28d794db0392de2681c95aa3774540c2aa425949810ec' UNION ALL
              SELECT '0x4b69b918206ce5082097368f630e84be5da50a471e3284b44e105e0275af9d14' UNION ALL
              SELECT '0x2b017a54b98cfa78df455c6d199c9e937c8af5804e9b719aa918bed0fcd33992' UNION ALL
              SELECT '0x8b38e6756fdf18ce0d89b819ac04513d3286a876518dd7b7203efa00418e9ca6' UNION ALL
              SELECT '0xa9221fafa62ed456b1ff0a17051998e88aadb1f9f1af0badb89a8b5a743e533f' UNION ALL
              SELECT '0x669cc8ba4f7fec0c0277642e5aeb2ce6b5d409204df1888f7a546a9e0fd30783' UNION ALL
              SELECT '0x9f85f7d7abbafbc84f4cce74097d70d4ebbec3b161db9ac1fb0aa5ea5709faa3' UNION ALL
              SELECT '0xbe55d9b972639bafe700dd917a7a7dcca1b672185171e17d69de1e97eaf779c0' UNION ALL
              SELECT '0x8e02b13009a5830f8ef5519afe70a7dfac3e193fdba954c25fb215783a163a5f' UNION ALL
              SELECT '0x96c75d93dc777a4028aca7ba280077fbcc58e00086137a4ee9967038b0649c92' UNION ALL
              SELECT '0xef90c66d4debb1cbeedc6c92d4bb8535451bea51a9fea6b3b8ba1dcc4e2e1ee9' UNION ALL
              SELECT '0xbd7ebae1f5245a17762178e5bbbfea9dacfade646c9d42e5d04e1d133c9595f2'
          ),
          UserTradeVolumes AS (
              SELECT 
                  user,
                  SUM(volume) AS user_volume
              FROM (
                  SELECT seller AS user, volume 
                  FROM TradeEvent 
                  WHERE timestamp BETWEEN ${fromTimestamp} AND ${toTimestamp}
                  AND seller NOT IN (SELECT user FROM ExcludedUsers)

                  UNION ALL

                  SELECT buyer AS user, volume 
                  FROM TradeEvent 
                  WHERE timestamp BETWEEN ${fromTimestamp} AND ${toTimestamp}
                  AND buyer NOT IN (SELECT user FROM ExcludedUsers)

              ) AS combined_trades
              GROUP BY user
          ),
          TotalMarketVolume AS (
              SELECT SUM(volume) AS market_volume 
              FROM TradeEvent
              WHERE timestamp BETWEEN ${fromTimestamp} AND ${toTimestamp}
          ),
          UserPoints AS (
              SELECT 
                  utv.user,
                  utv.user_volume,
                  ROUND((utv.user_volume / tmv.market_volume) * 200000 * 1.54978, 6) AS points
              FROM UserTradeVolumes utv
              CROSS JOIN TotalMarketVolume tmv
          )
          SELECT 
              up.user,
              up.user_volume,
              up.points,
              (SELECT SUM(points) FROM UserPoints) AS total_points
          FROM UserPoints up
          WHERE up.user = '${userAddress}'
          ORDER BY up.points DESC;
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
    startTime,
    endTime
  }: GetCompetitionParams): Promise<GetSentioResponse<GetCompetitionResponse>> {
    const offset = page * limit;
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `
        WITH RankedData AS (
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
                  user,
                  SUM(volume) AS total_volume
              FROM (
                  SELECT
                      t.buyer AS user,
                      t.volume
                  FROM TradeEvent t
                  WHERE t.timestamp >= ${startTime} AND t.timestamp <= ${endTime}
                  UNION ALL
                  SELECT
                      t.seller AS user,
                      t.volume
                  FROM TradeEvent t
                  WHERE t.timestamp >= ${startTime} AND t.timestamp <= ${endTime}
              ) AS combined
              GROUP BY user
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
