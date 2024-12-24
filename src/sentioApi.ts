import {
  getLeaderboardQuery,
  getTradeEventQuery,
  getUserScoreSnapshotQuery,
} from "./query/sentioQuery";
import {
  GetLeaderboardQueryParams,
  GetTradeEventQueryParams,
  GetUserScoreSnapshotParams,
  SentioApiParams,
} from "./interface";

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
      fromTimestamp: params.fromTimestamp,
      toTimestamp: params.toTimestamp,
      url: this.url,
      apiKey: this.apiKey,
    });
  };

  getTradeEvent = (params: GetTradeEventQueryParams) => {
    return getTradeEventQuery({
      userAddress: params.userAddress,
      fromTimestamp: params.fromTimestamp,
      toTimestamp: params.toTimestamp,
      url: this.url,
      apiKey: this.apiKey,
    });
  };

  getLeaderboard = (params: GetLeaderboardQueryParams) => {
    return getLeaderboardQuery({
      page: params.page,
      search: params.search,
      limit: params.limit,
      currentTimestamp: params.currentTimestamp,
      interval: params.interval,
      url: this.url,
      apiKey: this.apiKey,
    });
  };
}
