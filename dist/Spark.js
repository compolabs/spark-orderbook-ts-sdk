"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spark = void 0;
const fuels_1 = require("fuels");
const NetworkError_1 = require("./utils/NetworkError");
const constants_1 = require("./constants");
const ReadActions_1 = require("./ReadActions");
const WriteActions_1 = require("./WriteActions");
class Spark {
    constructor(params) {
        var _a, _b;
        this.write = new WriteActions_1.WriteActions();
        this.setActiveWallet = (wallet) => {
            const newOptions = Object.assign({}, this.options);
            newOptions.wallet = wallet;
            this.options = newOptions;
        };
        this.createSpotOrder = (baseToken, quoteToken, size, price) => __awaiter(this, void 0, void 0, function* () {
            return this.write.createSpotOrder(baseToken, quoteToken, size, price, this.getApiOptions());
        });
        this.cancelSpotOrder = (orderId) => __awaiter(this, void 0, void 0, function* () {
            yield this.write.cancelSpotOrder(orderId, this.getApiOptions());
        });
        this.mintToken = (token, amount) => __awaiter(this, void 0, void 0, function* () {
            yield this.write.mintToken(token, amount, this.getApiOptions());
        });
        this.depositPerpCollateral = (asset, amount) => __awaiter(this, void 0, void 0, function* () {
            yield this.write.depositPerpCollateral(asset.address, amount, this.getApiOptions());
        });
        this.withdrawPerpCollateral = (baseToken, gasToken, amount, oracleUpdateData) => __awaiter(this, void 0, void 0, function* () {
            yield this.write.withdrawPerpCollateral(baseToken.address, gasToken.address, amount, oracleUpdateData, this.getApiOptions());
        });
        this.openPerpOrder = (baseToken, gasToken, amount, price, updateData) => __awaiter(this, void 0, void 0, function* () {
            return this.write.openPerpOrder(baseToken.address, gasToken.address, amount, price, updateData, this.getApiOptions());
        });
        this.removePerpOrder = (assetId) => __awaiter(this, void 0, void 0, function* () {
            yield this.write.removePerpOrder(assetId, this.getApiOptions());
        });
        this.fulfillPerpOrder = (gasToken, orderId, amount, updateData) => __awaiter(this, void 0, void 0, function* () {
            return this.write.fulfillPerpOrder(gasToken.address, orderId, amount, updateData, this.getApiOptions());
        });
        this.fetchSpotMarkets = (limit) => __awaiter(this, void 0, void 0, function* () {
            return this.read.fetchSpotMarkets(limit);
        });
        this.fetchSpotMarketPrice = (baseToken) => __awaiter(this, void 0, void 0, function* () {
            return this.read.fetchSpotMarketPrice(baseToken.address);
        });
        this.fetchSpotOrders = (params) => __awaiter(this, void 0, void 0, function* () {
            return this.read.fetchSpotOrders(params);
        });
        this.fetchSpotTrades = (params) => __awaiter(this, void 0, void 0, function* () {
            return this.read.fetchSpotTrades(params);
        });
        this.fetchSpotVolume = () => __awaiter(this, void 0, void 0, function* () {
            return this.read.fetchSpotVolume();
        });
        this.fetchPerpCollateralBalance = (accountAddress, asset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpCollateralBalance(accountAddress, asset.address, options);
        });
        this.fetchPerpAllTraderPositions = (accountAddress) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpAllTraderPositions(accountAddress, options);
        });
        this.fetchPerpIsAllowedCollateral = (asset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpIsAllowedCollateral(asset.address, options);
        });
        this.fetchPerpTraderOrders = (accountAddress, asset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpTraderOrders(accountAddress, asset.address, options);
        });
        this.fetchPerpAllMarkets = (assetList, quoteAsset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpAllMarkets(assetList, quoteAsset, options);
        });
        this.fetchPerpFundingRate = (asset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpFundingRate(asset.address, options);
        });
        this.fetchPerpMaxAbsPositionSize = (accountAddress, asset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpMaxAbsPositionSize(accountAddress, asset.address, options);
        });
        this.fetchPerpPendingFundingPayment = (accountAddress, asset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpPendingFundingPayment(accountAddress, asset.address, options);
        });
        this.fetchPerpMarkPrice = (asset) => __awaiter(this, void 0, void 0, function* () {
            const options = yield this.getFetchOptions();
            return this.read.fetchPerpMarkPrice(asset.address, options);
        });
        this.getProviderWallet = () => __awaiter(this, void 0, void 0, function* () {
            const provider = yield this.providerPromise;
            return fuels_1.Wallet.generate({ provider });
        });
        this.getProvider = () => __awaiter(this, void 0, void 0, function* () {
            return this.providerPromise;
        });
        this.getFetchOptions = () => __awaiter(this, void 0, void 0, function* () {
            const providerWallet = yield this.getProviderWallet();
            const options = Object.assign(Object.assign({}, this.options), { wallet: providerWallet });
            return options;
        });
        this.getApiOptions = () => {
            if (!this.options.wallet) {
                throw new NetworkError_1.NetworkError(NetworkError_1.NETWORK_ERROR.UNKNOWN_WALLET);
            }
            return this.options;
        };
        this.options = {
            contractAddresses: params.contractAddresses,
            wallet: params.wallet,
            gasLimit: (_a = params.gasLimit) !== null && _a !== void 0 ? _a : constants_1.DEFAULT_GAS_LIMIT,
            gasPrice: (_b = params.gasPrice) !== null && _b !== void 0 ? _b : constants_1.DEFAULT_GAS_PRICE,
        };
        this.read = new ReadActions_1.ReadActions(params.indexerApiUrl);
        this.providerPromise = fuels_1.Provider.create(params.networkUrl);
    }
}
exports.Spark = Spark;
//# sourceMappingURL=Spark.js.map