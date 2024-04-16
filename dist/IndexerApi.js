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
exports.IndexerApi = void 0;
const Fetch_1 = require("./utils/Fetch");
class IndexerApi extends Fetch_1.Fetch {
    constructor() {
        super(...arguments);
        this.getSpotMarketCreateEvents = () => __awaiter(this, void 0, void 0, function* () {
            return this.get("/marketCreateEvents");
        });
        this.getSpotMarketCreateEventsById = (id) => __awaiter(this, void 0, void 0, function* () {
            return this.get(`/marketCreateEvents/${id}`);
        });
        this.getSpotOrders = (params) => __awaiter(this, void 0, void 0, function* () {
            const paramsCopy = Object.assign(Object.assign({}, params), { orderType: params.orderType
                    ? params.orderType.toLowerCase()
                    : undefined, isOpened: params.isOpened
                    ? String(params.isOpened)
                    : undefined });
            return this.get("/orders", paramsCopy);
        });
        this.getSpotOrdersById = (id) => __awaiter(this, void 0, void 0, function* () {
            return this.get(`/orders/${id}`);
        });
        this.getSpotOrderChangeEvents = () => __awaiter(this, void 0, void 0, function* () {
            return this.get("/orderChangeEvents");
        });
        this.getSpotOrderChangeEventsById = (id) => __awaiter(this, void 0, void 0, function* () {
            return this.get(`/ordersChangeEvents/${id}`);
        });
        this.getSpotTradeEvents = (params) => __awaiter(this, void 0, void 0, function* () {
            return this.get("/tradeEvents", params);
        });
        this.getSpotTradeEventsById = (id) => __awaiter(this, void 0, void 0, function* () {
            return this.get(`/tradeEvents/${id}`);
        });
    }
}
exports.IndexerApi = IndexerApi;
//# sourceMappingURL=IndexerApi.js.map