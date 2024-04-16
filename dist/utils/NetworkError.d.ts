export declare enum NETWORK_ERROR {
    INVALID_TOKEN = 1,
    NOT_CONNECTED = 2,
    INVALID_WALLET_PROVIDER = 3,
    UNKNOWN_WALLET = 4,
    UNKNOWN_ACCOUNT = 5
}
export declare class NetworkError extends Error {
    code: NETWORK_ERROR;
    constructor(code: NETWORK_ERROR);
}
