import {
  GetUserScoreSnapshotParams,
  GetUserScoreSnapshotResponse,
  SentioApiParams,
} from "src/interface";
import { Fetch } from "src/utils/Fetch";

interface sqlQueryParams {
  sqlQuery: {
    sql: string;
    size: number;
  };
}

export class SentioQuery extends Fetch {
  private apiKey: string;

  constructor({ url, apiKey }: SentioApiParams) {
    super(url);
    this.apiKey = apiKey;
  }

  async getUserScoreSnapshotQuery({
    userAddress,
    blockDate,
  }: GetUserScoreSnapshotParams): Promise<GetUserScoreSnapshotResponse> {
    const sqlQuery: sqlQueryParams = {
      sqlQuery: {
        sql: `SELECT total_value_locked_score, tradeVolume, block_date FROM UserScoreSnapshot_raw WHERE user_address = '${userAddress}' AND timestamp > '${blockDate}' ORDER BY timestamp;`,
        size: 1000,
      },
    };
    const headers: Record<string, string> = {
      "api-key": this.apiKey,
    };
    return await this.post<GetUserScoreSnapshotResponse>(
      sqlQuery,
      "same-origin",
      headers,
    );
  }
}

export const getUserScoreSnapshotQuery = async ({
  userAddress,
  blockDate,
  url,
  apiKey,
}: GetUserScoreSnapshotParams &
  SentioApiParams): Promise<GetUserScoreSnapshotResponse> => {
  const sentioQuery = new SentioQuery({ url, apiKey });
  return await sentioQuery.getUserScoreSnapshotQuery({
    userAddress,
    blockDate,
  });
};
