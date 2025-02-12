import {
  getLeaderboardPnlQuery,
  getLeaderboardQuery,
  getSortedLeaderboardPnlQuery,
  getSortedLeaderboardQuery,
  getTotalStatsQuery,
  getTotalStatsTableDataQuery,
  getTradeEventQuery,
  getUserPointsQuery,
  getUserScoreSnapshotQuery,
} from "./query/sentioQuery";
import {
  GetLeaderboardPnlQueryParams,
  GetLeaderboardQueryParams,
  GetSortedLeaderboardPnlQueryParams,
  GetSortedLeaderboardQueryParams,
  GetTotalStatsTableDataParams,
  GetTradeEventQueryParams,
  GetUserPointQueryParams,
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

  getSortedLeaderboard = (params: GetSortedLeaderboardQueryParams) => {
    return getSortedLeaderboardQuery({
      ...params,
      url: this.url,
      apiKey: this.apiKey,
    });
  };

  getLeaderboardQuery = (params: GetLeaderboardQueryParams) => {
    return getLeaderboardQuery({
      ...params,
      url: this.url,
      apiKey: this.apiKey,
    });
  };

  getLeaderboardPnl = (params: GetLeaderboardPnlQueryParams) => {
    return getLeaderboardPnlQuery({
      ...params,
      url: this.url,
      apiKey: this.apiKey,
    });
  };
  getSortedLeaderboardPnl = (params: GetSortedLeaderboardPnlQueryParams) => {
    return getSortedLeaderboardPnlQuery({
      ...params,
      url: this.url,
      apiKey: this.apiKey,
    });
  };
  getUserPoints = (params: GetUserPointQueryParams) => {
    return getUserPointsQuery({
      ...params,
      url: this.url,
      apiKey: this.apiKey,
    });
  };
  getTotalStats = () => {
    return getTotalStatsQuery({
      url: this.url,
      apiKey: this.apiKey,
    });
  };
  getTotalStatsTableData = (params: GetTotalStatsTableDataParams) => {
    return getTotalStatsTableDataQuery({
      ...params,
      url: this.url,
      apiKey: this.apiKey,
    });
  };
}
