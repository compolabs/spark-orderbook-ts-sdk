import { getUserScoreSnapshotQuery } from "./query/sentioQuery";
import { GetUserScoreSnapshotParams } from "./interface";

export class SentioApi {
  getUserScoreSnapshot = (params: GetUserScoreSnapshotParams) => {
    return getUserScoreSnapshotQuery({
      userAddress: params.userAddress,
      blockDate: params.blockDate,
    });
  };
}
