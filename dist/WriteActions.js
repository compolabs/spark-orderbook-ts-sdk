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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WriteActions = void 0;
const fuels_1 = require("fuels");
const account_balance_1 = require("./types/account-balance");
const clearing_house_1 = require("./types/clearing-house");
const orderbook_1 = require("./types/orderbook");
const perp_market_1 = require("./types/perp-market");
const proxy_1 = require("./types/proxy");
const pyth_1 = require("./types/pyth");
const src_20_1 = require("./types/src-20");
const vault_1 = require("./types/vault");
const BN_1 = __importDefault(require("./utils/BN"));
const constants_1 = require("./constants");
class WriteActions {
    constructor() {
        this.createSpotOrder = (baseToken, quoteToken, size, price, options) => __awaiter(this, void 0, void 0, function* () {
            const orderbookFactory = orderbook_1.OrderbookAbi__factory.connect(options.contractAddresses.spotMarket, options.wallet);
            const assetId = { value: baseToken.address };
            const isNegative = size.includes("-");
            const absSize = size.replace("-", "");
            const baseSize = { value: absSize, negative: isNegative };
            const amountToSend = new BN_1.default(absSize)
                .times(price)
                .dividedToIntegerBy(new BN_1.default(10).pow(constants_1.DEFAULT_DECIMALS + baseToken.decimals - quoteToken.decimals));
            const forward = {
                amount: isNegative ? absSize : amountToSend.toString(),
                assetId: isNegative ? baseToken.address : quoteToken.address,
            };
            const tx = yield orderbookFactory.functions
                .open_order(assetId, baseSize, price)
                .callParams({ forward })
                .txParams({ gasPrice: options.gasPrice, gasLimit: options.gasLimit })
                .call();
            return tx.transactionId;
        });
        this.cancelSpotOrder = (orderId, options) => __awaiter(this, void 0, void 0, function* () {
            const orderbookFactory = orderbook_1.OrderbookAbi__factory.connect(options.contractAddresses.spotMarket, options.wallet);
            yield orderbookFactory.functions
                .cancel_order(orderId)
                .txParams({ gasPrice: options.gasPrice, gasLimit: options.gasLimit })
                .call();
        });
        this.mintToken = (token, amount, options) => __awaiter(this, void 0, void 0, function* () {
            const tokenFactory = options.contractAddresses.tokenFactory;
            const tokenFactoryContract = src_20_1.TokenAbi__factory.connect(tokenFactory, options.wallet);
            const mintAmount = BN_1.default.parseUnits(amount, token.decimals);
            const hash = (0, fuels_1.hashMessage)(token.address);
            const identity = {
                Address: {
                    value: options.wallet.address.toB256(),
                },
            };
            yield tokenFactoryContract.functions
                .mint(identity, hash, mintAmount.toString())
                .txParams({ gasPrice: options.gasPrice, gasLimit: options.gasLimit })
                .call();
        });
        this.approve = (assetAddress, amount) => __awaiter(this, void 0, void 0, function* () { });
        this.allowance = (assetAddress) => __awaiter(this, void 0, void 0, function* () {
            return "";
        });
        this.depositPerpCollateral = (assetAddress, amount, options) => __awaiter(this, void 0, void 0, function* () {
            const vaultFactory = vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet);
            const assetIdInput = {
                value: assetAddress,
            };
            const forward = {
                assetId: assetAddress,
                amount,
            };
            yield vaultFactory.functions
                .deposit_collateral(assetIdInput)
                .callParams({ forward })
                .txParams({ gasPrice: options.gasPrice, gasLimit: options.gasLimit })
                .call();
        });
        this.withdrawPerpCollateral = (baseTokenAddress, gasTokenAddress, amount, updateData, options) => __awaiter(this, void 0, void 0, function* () {
            const vaultFactory = vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet);
            const assetIdInput = {
                value: baseTokenAddress,
            };
            const parsedUpdateData = updateData.map((v) => Array.from((0, fuels_1.arrayify)(v)));
            const forward = {
                amount: "10",
                assetId: gasTokenAddress,
            };
            yield vaultFactory.functions
                .withdraw_collateral(amount, assetIdInput, parsedUpdateData)
                .callParams({ forward })
                .txParams({ gasPrice: 1 })
                .addContracts([
                proxy_1.ProxyAbi__factory.connect(options.contractAddresses.proxy, options.wallet),
                perp_market_1.PerpMarketAbi__factory.connect(options.contractAddresses.perpMarket, options.wallet),
                account_balance_1.AccountBalanceAbi__factory.connect(options.contractAddresses.accountBalance, options.wallet),
                clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet),
                vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet),
                pyth_1.PythContractAbi__factory.connect(options.contractAddresses.pyth, options.wallet),
            ])
                .call();
        });
        this.openPerpOrder = (baseTokenAddress, gasTokenAddress, amount, price, updateData, options) => __awaiter(this, void 0, void 0, function* () {
            const clearingHouseFactory = clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet);
            const assetIdInput = {
                value: baseTokenAddress,
            };
            const isNegative = amount.includes("-");
            const absSize = amount.replace("-", "");
            const baseSize = { value: absSize, negative: isNegative };
            const parsedUpdateData = updateData.map((v) => Array.from((0, fuels_1.arrayify)(v)));
            const forward = {
                amount: "10",
                assetId: gasTokenAddress,
            };
            const tx = yield clearingHouseFactory.functions
                .open_order(assetIdInput, baseSize, price, parsedUpdateData)
                .callParams({ forward })
                .txParams({ gasPrice: options.gasPrice, gasLimit: options.gasLimit })
                .addContracts([
                proxy_1.ProxyAbi__factory.connect(options.contractAddresses.proxy, options.wallet),
                perp_market_1.PerpMarketAbi__factory.connect(options.contractAddresses.perpMarket, options.wallet),
                account_balance_1.AccountBalanceAbi__factory.connect(options.contractAddresses.accountBalance, options.wallet),
                vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet),
                pyth_1.PythContractAbi__factory.connect(options.contractAddresses.pyth, options.wallet),
            ])
                .call();
            return tx.transactionId;
        });
        this.removePerpOrder = (orderId, options) => __awaiter(this, void 0, void 0, function* () {
            const clearingHouseFactory = clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet);
            yield clearingHouseFactory.functions
                .remove_order(orderId)
                .txParams({ gasPrice: options.gasPrice, gasLimit: options.gasLimit })
                .addContracts([
                proxy_1.ProxyAbi__factory.connect(options.contractAddresses.proxy, options.wallet),
                perp_market_1.PerpMarketAbi__factory.connect(options.contractAddresses.perpMarket, options.wallet),
                clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet),
            ])
                .call();
        });
        this.fulfillPerpOrder = (gasTokenAddress, orderId, amount, updateData, options) => __awaiter(this, void 0, void 0, function* () {
            const clearingHouseFactory = clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet);
            const isNegative = amount.includes("-");
            const absSize = amount.replace("-", "");
            const baseSize = { value: absSize, negative: isNegative };
            const parsedUpdateData = updateData.map((v) => Array.from((0, fuels_1.arrayify)(v)));
            const forward = {
                amount: "10",
                assetId: gasTokenAddress,
            };
            yield clearingHouseFactory.functions
                .fulfill_order(baseSize, orderId, parsedUpdateData)
                .callParams({ forward })
                .txParams({ gasPrice: options.gasPrice, gasLimit: options.gasLimit })
                .addContracts([
                proxy_1.ProxyAbi__factory.connect(options.contractAddresses.proxy, options.wallet),
                perp_market_1.PerpMarketAbi__factory.connect(options.contractAddresses.perpMarket, options.wallet),
                account_balance_1.AccountBalanceAbi__factory.connect(options.contractAddresses.accountBalance, options.wallet),
                clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet),
                vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet),
                pyth_1.PythContractAbi__factory.connect(options.contractAddresses.pyth, options.wallet),
            ])
                .call();
        });
    }
}
exports.WriteActions = WriteActions;
//# sourceMappingURL=WriteActions.js.map