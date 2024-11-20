import { getUserScoreSnapshotQuery } from "./query/sentioQuery";

export class SentioApi {
  getUserScoreSnapshot = () => {
    console.log("getUserScoreSnapshot");
    return getUserScoreSnapshotQuery({
      userAddress:
        "0x2938930c975daedb1ef989ecc3990f9adc92c6832ad3d0a7fc602549c5c60033",
      blockDate: 1731888000,
    });
  };
}
