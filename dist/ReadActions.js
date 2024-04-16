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
exports.ReadActions = void 0;
const fuels_1 = require("fuels");
const account_balance_1 = require("./types/account-balance");
const clearing_house_1 = require("./types/clearing-house");
const perp_market_1 = require("./types/perp-market");
const vault_1 = require("./types/vault");
const BN_1 = __importDefault(require("./utils/BN"));
const convertI64ToBn_1 = require("./utils/convertI64ToBn");
const getUnixTime_1 = __importDefault(require("./utils/getUnixTime"));
const IndexerApi_1 = require("./IndexerApi");
class ReadActions {
    constructor(url) {
        this.fetchSpotMarkets = (limit) => __awaiter(this, void 0, void 0, function* () {
            const data = yield this.indexerApi.getSpotMarketCreateEvents();
            const markets = data.map((market) => ({
                id: market.asset_id,
                assetId: market.asset_id,
                decimal: Number(market.asset_decimals),
            }));
            return markets;
        });
        this.fetchSpotMarketPrice = (baseToken) => __awaiter(this, void 0, void 0, function* () {
            console.warn("[fetchMarketPrice] NOT IMPLEMENTED FOR FUEL");
            return BN_1.default.ZERO;
        });
        this.fetchSpotOrders = (_a) => __awaiter(this, [_a], void 0, function* ({ baseToken, type, limit, trader, isActive, }) {
            const traderAddress = trader
                ? new fuels_1.Address(trader).toB256()
                : undefined;
            const data = yield this.indexerApi.getSpotOrders({
                baseToken,
                orderType: type,
                limit,
                trader: traderAddress,
                isOpened: isActive,
            });
            const orders = data.map((order) => {
                const baseSize = new BN_1.default(order.base_size);
                const basePrice = new BN_1.default(order.base_price);
                return {
                    id: order.order_id,
                    baseToken: order.base_token,
                    trader: order.trader,
                    baseSize: baseSize.toNumber(),
                    orderPrice: basePrice.toNumber(),
                    blockTimestamp: (0, getUnixTime_1.default)(order.createdAt),
                };
            });
            return orders;
        });
        this.fetchSpotTrades = (_b) => __awaiter(this, [_b], void 0, function* ({ baseToken, limit, trader, }) {
            const traderAddress = trader
                ? new fuels_1.Address(trader).toB256()
                : undefined;
            const data = yield this.indexerApi.getSpotTradeEvents({
                limit,
                trader: traderAddress,
                baseToken,
            });
            return data.map((trade) => ({
                baseToken: trade.base_token,
                buyer: trade.buyer,
                id: String(trade.id),
                matcher: trade.order_matcher,
                seller: trade.seller,
                tradeAmount: new BN_1.default(trade.trade_size),
                price: new BN_1.default(trade.trade_price),
                timestamp: (0, getUnixTime_1.default)(trade.createdAt),
                userAddress: trader,
            }));
        });
        this.fetchSpotVolume = () => __awaiter(this, void 0, void 0, function* () {
            console.warn("[fetchVolume] NOT IMPLEMENTED FOR FUEL");
            return { volume: BN_1.default.ZERO, high: BN_1.default.ZERO, low: BN_1.default.ZERO };
        });
        this.fetchPerpCollateralBalance = (accountAddress, assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const vaultFactory = vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet);
            const addressInput = {
                value: new fuels_1.Address(accountAddress).toB256(),
            };
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield vaultFactory.functions
                .get_collateral_balance(addressInput, assetIdInput)
                .get();
            const collateralBalance = new BN_1.default(result.value.toString());
            return collateralBalance;
        });
        this.fetchPerpAllTraderPositions = (accountAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const accountBalanceFactory = account_balance_1.AccountBalanceAbi__factory.connect(options.contractAddresses.accountBalance, options.wallet);
            const addressInput = {
                value: new fuels_1.Address(accountAddress).toB256(),
            };
            const result = yield accountBalanceFactory.functions
                .get_all_trader_positions(addressInput)
                .get();
            const positions = result.value.map(([assetAddress, accountBalance]) => ({
                baseTokenAddress: assetAddress.value,
                lastTwPremiumGrowthGlobal: (0, convertI64ToBn_1.convertI64ToBn)(accountBalance.last_tw_premium_growth_global),
                takerOpenNational: (0, convertI64ToBn_1.convertI64ToBn)(accountBalance.taker_open_notional),
                takerPositionSize: (0, convertI64ToBn_1.convertI64ToBn)(accountBalance.taker_position_size),
            }));
            return positions;
        });
        this.fetchPerpMarketPrice = (assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const perpMarketFactory = perp_market_1.PerpMarketAbi__factory.connect(options.contractAddresses.perpMarket, options.wallet);
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield perpMarketFactory.functions
                .get_market_price(assetIdInput)
                .get();
            const marketPrice = new BN_1.default(result.value.toString());
            return marketPrice;
        });
        this.fetchPerpFundingRate = (assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const accountBalanceFactory = account_balance_1.AccountBalanceAbi__factory.connect(options.contractAddresses.accountBalance, options.wallet);
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield accountBalanceFactory.functions
                .get_funding_rate(assetIdInput)
                .get();
            const fundingRate = (0, convertI64ToBn_1.convertI64ToBn)(result.value);
            return fundingRate;
        });
        this.fetchPerpFreeCollateral = (accountAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const vaultFactory = vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet);
            const addressInput = {
                value: new fuels_1.Address(accountAddress).toB256(),
            };
            const result = yield vaultFactory.functions
                .get_free_collateral(addressInput)
                .get();
            const freeCollateral = new BN_1.default(result.value.toString());
            return freeCollateral;
        });
        this.fetchPerpMarket = (baseAsset, quoteAsset, options) => __awaiter(this, void 0, void 0, function* () {
            const clearingHouseFactory = clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet);
            const assetIdInput = {
                value: baseAsset.address,
            };
            const result = yield clearingHouseFactory.functions
                .get_market(assetIdInput)
                .get();
            const pausedIndexPrice = result.value.paused_index_price
                ? new BN_1.default(result.value.paused_index_price.toString())
                : undefined;
            const pausedTimestamp = result.value.paused_timestamp
                ? new BN_1.default(result.value.paused_timestamp.toString()).toNumber()
                : undefined;
            const closedPrice = result.value.closed_price
                ? new BN_1.default(result.value.closed_price.toString())
                : undefined;
            const perpMarket = {
                baseTokenAddress: result.value.asset_id.value,
                quoteTokenAddress: quoteAsset.address,
                imRatio: new BN_1.default(result.value.im_ratio.toString()),
                mmRatio: new BN_1.default(result.value.mm_ratio.toString()),
                status: result.value.status,
                pausedIndexPrice,
                pausedTimestamp,
                closedPrice,
            };
            return perpMarket;
        });
        this.fetchPerpAllMarkets = (assets, quoteAsset, options) => __awaiter(this, void 0, void 0, function* () {
            const markets = [];
            for (const token of assets) {
                try {
                    const market = yield this.fetchPerpMarket(token, quoteAsset, options);
                    markets.push(market);
                }
                catch (_c) {
                    /* empty */
                }
            }
            return markets;
        });
        this.fetchPerpPendingFundingPayment = (accountAddress, assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const accountBalanceFactory = account_balance_1.AccountBalanceAbi__factory.connect(options.contractAddresses.accountBalance, options.wallet);
            const addressInput = {
                value: new fuels_1.Address(accountAddress).toB256(),
            };
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield accountBalanceFactory.functions
                .get_pending_funding_payment(addressInput, assetIdInput)
                .get();
            const fundingPayment = (0, convertI64ToBn_1.convertI64ToBn)(result.value[0]);
            const fundingGrowthPayment = (0, convertI64ToBn_1.convertI64ToBn)(result.value[1]);
            return { fundingPayment, fundingGrowthPayment };
        });
        this.fetchPerpIsAllowedCollateral = (assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const vaultFactory = vault_1.VaultAbi__factory.connect(options.contractAddresses.vault, options.wallet);
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield vaultFactory.functions
                .is_allowed_collateral(assetIdInput)
                .get();
            return result.value;
        });
        this.fetchPerpTraderOrders = (accountAddress, assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const vaultFactory = perp_market_1.PerpMarketAbi__factory.connect(options.contractAddresses.perpMarket, options.wallet);
            const addressInput = {
                value: new fuels_1.Address(accountAddress).toB256(),
            };
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield vaultFactory.functions
                .get_trader_orders(addressInput, assetIdInput)
                .get();
            const orders = result.value.map((order) => ({
                id: order.id,
                baseSize: (0, convertI64ToBn_1.convertI64ToBn)(order.base_size),
                baseTokenAddress: order.base_token.value,
                orderPrice: new BN_1.default(order.order_price.toString()),
                trader: order.trader.value,
            }));
            return orders;
        });
        this.fetchPerpMaxAbsPositionSize = (accountAddress, assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const clearingHouseFactory = clearing_house_1.ClearingHouseAbi__factory.connect(options.contractAddresses.clearingHouse, options.wallet);
            const addressInput = {
                value: new fuels_1.Address(accountAddress).toB256(),
            };
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield clearingHouseFactory.functions
                .get_max_abs_position_size(addressInput, assetIdInput)
                .get();
            const shortSize = new BN_1.default(result.value[0].toString());
            const longSize = new BN_1.default(result.value[0].toString());
            return { shortSize, longSize };
        });
        this.fetchPerpMarkPrice = (assetAddress, options) => __awaiter(this, void 0, void 0, function* () {
            const vaultFactory = perp_market_1.PerpMarketAbi__factory.connect(options.contractAddresses.perpMarket, options.wallet);
            const assetIdInput = {
                value: assetAddress,
            };
            const result = yield vaultFactory.functions
                .get_mark_price(assetIdInput)
                .get();
            const markPrice = new BN_1.default(result.value.toString());
            return markPrice;
        });
        this.indexerApi = new IndexerApi_1.IndexerApi(url);
    }
}
exports.ReadActions = ReadActions;
//# sourceMappingURL=ReadActions.js.map