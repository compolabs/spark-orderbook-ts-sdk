"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NetworkError = exports.NETWORK_ERROR = void 0;
var NETWORK_ERROR;
(function (NETWORK_ERROR) {
    NETWORK_ERROR[NETWORK_ERROR["INVALID_TOKEN"] = 1] = "INVALID_TOKEN";
    NETWORK_ERROR[NETWORK_ERROR["NOT_CONNECTED"] = 2] = "NOT_CONNECTED";
    NETWORK_ERROR[NETWORK_ERROR["INVALID_WALLET_PROVIDER"] = 3] = "INVALID_WALLET_PROVIDER";
    NETWORK_ERROR[NETWORK_ERROR["UNKNOWN_WALLET"] = 4] = "UNKNOWN_WALLET";
    NETWORK_ERROR[NETWORK_ERROR["UNKNOWN_ACCOUNT"] = 5] = "UNKNOWN_ACCOUNT";
})(NETWORK_ERROR || (exports.NETWORK_ERROR = NETWORK_ERROR = {}));
const NETWORK_ERROR_MESSAGE = {
    [NETWORK_ERROR.INVALID_TOKEN]: "Invalid token.",
    [NETWORK_ERROR.INVALID_WALLET_PROVIDER]: "Wallet not connected.",
    [NETWORK_ERROR.NOT_CONNECTED]: "Not connected to a wallet.",
    [NETWORK_ERROR.UNKNOWN_WALLET]: "Wallet does not exist.",
    [NETWORK_ERROR.UNKNOWN_ACCOUNT]: "Account is not connected.",
};
class NetworkError extends Error {
    constructor(code) {
        super(NETWORK_ERROR_MESSAGE[code]);
        this.code = code;
        Object.setPrototypeOf(this, NetworkError.prototype);
    }
}
exports.NetworkError = NetworkError;
//# sourceMappingURL=NetworkError.js.map