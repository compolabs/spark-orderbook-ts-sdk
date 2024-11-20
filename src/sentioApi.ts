import { getUserScoreSnapshotQuery } from "./query/sentioQuery";
import { GetUserScoreSnapshotParams, SentioApiParams } from "./interface";

export class SentioApi {
  private url: string;
  private apiKey: string;

  constructor({ url, apiKey }: SentioApiParams) {
    this.url = url;
    this.apiKey = apiKey;
  }

  getUserScoreSnapshot = (params: GetUserScoreSnapshotParams) => {
    return getUserScoreSnapshotQuery({
      userAddress: params.userAddress,
      blockDate: params.blockDate,
      url: this.url,
      apiKey: this.apiKey,
    });
  };
}
