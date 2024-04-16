"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertI64ToBn = void 0;
const BN_1 = __importDefault(require("./BN"));
const convertI64ToBn = (input) => {
    return new BN_1.default(input.value.toString()).multipliedBy(input.negative ? -1 : 1);
};
exports.convertI64ToBn = convertI64ToBn;
//# sourceMappingURL=convertI64ToBn.js.map