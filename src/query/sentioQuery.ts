import {
  GetUserScoreSnapshotParams,
  GetUserScoreSnapshotResponse,
} from "src/interface";
import { Fetch } from "src/utils/Fetch";

interface sqlQuery {
  sqlQuery: {
    sql: string;
    size: number;
  };
}

class SentioQuery extends Fetch {
  constructor() {
    super(
      "https://app.sentio.xyz/api/v1/analytics/zhpv96/spark-processor/sql/execute",
    );
  }

  async getUserScoreSnapshotQuery({
    userAddress,
    blockDate,
  }: GetUserScoreSnapshotParams): Promise<GetUserScoreSnapshotResponse> {
    const sqlQuery: sqlQuery = {
      sqlQuery: {
        sql: `SELECT total_value_locked_score, tradeVolume, block_date FROM UserScoreSnapshot_raw WHERE user_address = '${userAddress}' AND timestamp > '${blockDate}' ORDER BY timestamp;`,
        size: 1000,
      },
    };
    const headers: Record<string, string> = {
      "api-key": "TLjw41s3DYbWALbwmvwLDM9vbVEDrD9BP", // TODO: ключь который не должен быть открыть пользователю, но договорились, что берем на себя риски и если что будет его менять
    };
    const qq = this.post<IndexerResponse<sqlQuery, "UserScoreSnapshot">>(
      sqlQuery,
      "same-origin",
      headers,
    );
    console.log("qq", qq);
    const response = await qq;
    console.log("123", response);
    return true;
  }
}

export const getUserScoreSnapshotQuery = async ({
  userAddress,
  blockDate,
}: GetUserScoreSnapshotParams): Promise<GetUserScoreSnapshotResponse> => {
  const sentioQuery = new SentioQuery();
  return await sentioQuery.getUserScoreSnapshotQuery({
    userAddress,
    blockDate,
  });
};
