import { LendReadActions } from "./read-actions/LendReadActions";
import { PerpReadActions } from "./read-actions/PerpReadActions";
import { SpotReadActions } from "./read-actions/SpotReadActions";
import { IndexerApi } from "./IndexerApi";
import { Options } from "./interface";

export class ReadActions {
  protected indexerApi: IndexerApi;
  perp: PerpReadActions;
  spot: SpotReadActions;
  lend: LendReadActions;

  constructor(url: string) {
    this.indexerApi = new IndexerApi(url);
    this.perp = new PerpReadActions(url);
    this.spot = new SpotReadActions(url);
    this.lend = new LendReadActions(url);
  }

  fetchWalletBalance = async (
    assetId: string,
    options: Options,
  ): Promise<string> => {
    const bn = await options.wallet.getBalance(assetId);
    return bn.toString();
  };
}
