import {
  GetLeaderboardPnlQueryParams,
  GetLeaderboardQueryParams,
  GetSentioResponse,
  GetSortedLeaderboardPnlQueryParams,
  GetSortedLeaderboardQueryParams,
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

  async getUserPoints({
    userAddress,
    fromTimestamp,
    toTimestamp,
  }: GetTradeEventQueryParams): Promise<GetSentioResponse<UserPointsResponse>> {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `SELECT (total_volume / latest_volume) * 400000 AS result FROM
        (SELECT
          SUM(te.volume) AS total_volume,
            (SELECT volume
              FROM TotalVolume_raw
              ORDER BY timestamp DESC
              LIMIT 1) AS latest_volume
          FROM
            TradeEvent te
          WHERE
            (te.seller = '${userAddress}'
              OR te.buyer = '${userAddress}')
          AND te.timestamp BETWEEN '${fromTimestamp}' AND '${toTimestamp}'
        ) AS aggregated_data;`,
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
