import {
  GetUserScoreSnapshotParams,
  GetUserScoreSnapshotResponse,
} from "src/interface";
import { AxiosService } from "src/service/axiosService";

interface sqlQuery {
  sqlQuery: {
    sql: string;
    size: number;
  };
}

export const getUserScoreSnapshotQuery = async ({
  userAddress,
  blockDate,
}: GetUserScoreSnapshotParams): Promise<GetUserScoreSnapshotResponse> => {
  const url = `https://app.sentio.xyz/api/v1/analytics/zhpv96/spark-processor/sql/execute`;
  const sqlQuery: sqlQuery = {
    sqlQuery: {
      sql: `SELECT total_value_locked_score, tradeVolume, block_date FROM UserScoreSnapshot_raw WHERE user_address = '${userAddress}' AND timestamp > '${blockDate}' ORDER BY timestamp;`,
      size: 1000,
    },
  };
  const headers: Record<string, string> = {
    "api-key": "TLjw41s3DYbWALbwmvwLDM9vbVEDrD9BP", // TODO: ключь который не должен быть открыть пользователю, но договорились, что берем на себя риски и если что будет его менять
  };
  return await AxiosService.post<sqlQuery>(url, sqlQuery, headers);
};
