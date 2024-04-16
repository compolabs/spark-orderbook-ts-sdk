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
exports.Fetch = void 0;
class Fetch {
    constructor(url) {
        this.request = (endpoint, data) => __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(`${this.url}${endpoint}`, data);
            if (!response.ok) {
                throw new Error(response.statusText);
            }
            return response.json();
        });
        this.post = (endpoint, body, credentials = "same-origin") => {
            return this.request(endpoint, {
                method: "POST",
                body: JSON.stringify(body),
                credentials,
                headers: {
                    "Content-Type": "application/json",
                },
            });
        };
        this.get = (endpoint, params = {}) => {
            const validParams = Object.entries(params).filter(([, value]) => Boolean(value));
            const searchParams = new URLSearchParams(validParams);
            return this.request(`${endpoint}?${searchParams.toString()}`, {
                method: "GET",
            });
        };
        this.url = url;
    }
}
exports.Fetch = Fetch;
//# sourceMappingURL=Fetch.js.map