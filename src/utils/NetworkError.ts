export enum NETWORK_ERROR {
  INVALID_TOKEN = 1,
  NOT_CONNECTED = 2,
  INVALID_WALLET_PROVIDER = 3,
  UNKNOWN_WALLET = 4,
  UNKNOWN_ACCOUNT = 5,
}

const NETWORK_ERROR_MESSAGE: Record<NETWORK_ERROR, string> = {
  [NETWORK_ERROR.INVALID_TOKEN]: "Invalid token.",
  [NETWORK_ERROR.INVALID_WALLET_PROVIDER]: "Wallet not connected.",
  [NETWORK_ERROR.NOT_CONNECTED]: "Not connected to a wallet.",
  [NETWORK_ERROR.UNKNOWN_WALLET]: "Wallet does not exist.",
  [NETWORK_ERROR.UNKNOWN_ACCOUNT]: "Account is not connected.",
};

export class NetworkError extends Error {
  code: NETWORK_ERROR;

  constructor(code: NETWORK_ERROR) {
    super(NETWORK_ERROR_MESSAGE[code]);
    this.code = code;

    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}
