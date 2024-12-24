import {
  GetLeaderboardQueryParams,
  GetSentioResponse,
  GetTradeEventQueryParams,
  GetUserScoreSnapshotParams,
  RowSnapshot,
  RowTradeEvent,
  SentioApiParams,
  TraderVolumeResponse,
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

  async getLeaderboardQuery({
    page,
    search = "",
    limit,
    currentTimestamp,
    interval,
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
              WHERE walletId LIKE '%${search}%'
          )
          SELECT 
              id,
              walletId,
              traderVolume,
              totalCount
          FROM Filtered
          ORDER BY traderVolume DESC
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
}

export const getUserScoreSnapshotQuery = async ({
  userAddress,
  fromTimestamp,
  toTimestamp,
  url,
  apiKey,
}: GetUserScoreSnapshotParams & SentioApiParams): Promise<
  GetSentioResponse<RowSnapshot>
> => {
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getUserScoreSnapshotQuery({
    userAddress,
    fromTimestamp,
    toTimestamp,
  });
};

export const getTradeEventQuery = async ({
  userAddress,
  fromTimestamp,
  toTimestamp,
  url,
  apiKey,
}: GetTradeEventQueryParams & SentioApiParams): Promise<
  GetSentioResponse<RowTradeEvent>
> => {
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getTradeEventQuery({
    userAddress,
    fromTimestamp,
    toTimestamp,
  });
};

export const getLeaderboardQuery = async ({
  page,
  search,
  url,
  limit,
  apiKey,
  currentTimestamp,
  interval,
}: GetLeaderboardQueryParams & SentioApiParams): Promise<
  GetSentioResponse<TraderVolumeResponse>
> => {
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getLeaderboardQuery({
    page,
    search,
    limit,
    currentTimestamp,
    interval,
  });
};
