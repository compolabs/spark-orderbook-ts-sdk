import { IndexerApi } from "./IndexerApi";
import { Options } from "./interface";
import {
  LendReadActions,
  PerpReadActions,
  SpotReadActions,
} from "./read-actions";

export class ReadActions {
  protected indexerApi: IndexerApi;
  public spot: SpotReadActions;
  public lend: LendReadActions;
  public perp: PerpReadActions;

  constructor(url: string) {
    this.indexerApi = new IndexerApi(url);
    this.perp = new PerpReadActions(url);
    this.spot = new SpotReadActions(url);
    this.lend = new LendReadActions();
  }

  fetchWalletBalance = async (
    assetId: string,
    options: Options,
  ): Promise<string> => {
    const balance = await options.wallet.getBalance(assetId);
    return balance.toString();
  };
}
