"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bignumber_js_1 = __importDefault(require("bignumber.js"));
bignumber_js_1.default.config({ EXPONENTIAL_AT: [-100, 100] });
const bigNumberify = (n) => {
    if (n && n.toString) {
        const primitive = n.toString();
        if (typeof primitive !== "object") {
            return primitive;
        }
    }
    return n;
};
class BN extends bignumber_js_1.default {
    constructor(n, base) {
        super(bigNumberify(n), base);
        this.dividedBy = this.div;
        this.exponentiatedBy = this.pow;
        this.modulo = this.mod;
        this.multipliedBy = this.times;
        this.squareRoot = this.sqrt;
        /**
         * @example
         * new BN('1234.5678').toSignificant(2) === 1,234.56
         * new BN('1234.506').toSignificant(2) === 1,234.5
         * new BN('123.0000').toSignificant(2) === 123
         * new BN('0.001234').toSignificant(2) === 0.0012
         */
        this.toSignificant = (significantDigits, roundingMode = bignumber_js_1.default.ROUND_DOWN, format) => {
            return this.gte(1) || significantDigits === 0
                ? this.toFormat(significantDigits, roundingMode, format).replace(/(\.[0-9]*[1-9])0+$|\.0+$/, "$1")
                : super.precision(significantDigits, roundingMode).toString();
        };
    }
    static clamp(number, min, max) {
        return BN.min(BN.max(number, min), max);
    }
    static max(...n) {
        return new BN(super.max(...n.map(bigNumberify)));
    }
    static min(...n) {
        return new BN(super.min(...n.map(bigNumberify)));
    }
    static toBN(p) {
        return p.then((v) => new BN(v));
    }
    static parseUnits(value, decimals = 8) {
        return new BN(10).pow(decimals).times(bigNumberify(value));
    }
    static formatUnits(value, decimals = 8) {
        return new BN(value).div(new BN(10).pow(decimals));
    }
    static percentOf(value, percent) {
        return new BN(new BN(value).times(percent).div(100).toFixed(0));
    }
    static ratioOf(valueA, valueB) {
        return new BN(valueA).div(valueB).times(100);
    }
    abs() {
        return new BN(super.abs());
    }
    div(n, base) {
        return new BN(super.div(bigNumberify(n), base));
    }
    pow(n, m) {
        return new BN(super.pow(bigNumberify(n), bigNumberify(m)));
    }
    minus(n, base) {
        return new BN(super.minus(bigNumberify(n), base));
    }
    mod(n, base) {
        return new BN(super.mod(bigNumberify(n), base));
    }
    times(n, base) {
        return new BN(super.times(bigNumberify(n), base));
    }
    negated() {
        return new BN(super.negated());
    }
    plus(n, base) {
        return new BN(super.plus(bigNumberify(n), base));
    }
    sqrt() {
        return new BN(super.sqrt());
    }
    toDecimalPlaces(decimalPlaces, roundingMode = bignumber_js_1.default.ROUND_DOWN) {
        return new BN(super.dp(decimalPlaces, roundingMode));
    }
    toBigFormat(decimalPlaces) {
        if (super.toNumber() > 999 && super.toNumber() < 1000000) {
            return (super.toNumber() / 1000).toFixed(1) + "K";
        }
        else if (super.toNumber() > 1000000) {
            return (super.toNumber() / 1000000).toFixed(1) + "M";
        }
        else if (super.toNumber() < 900) {
            return super.toFormat(decimalPlaces); // if value < 1000, nothing to do
        }
        return super.toFormat(decimalPlaces);
    }
    clamp(min, max) {
        return BN.min(BN.max(this, min), max);
    }
}
BN.ZERO = new BN(0);
BN.MaxUint256 = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
exports.default = BN;
//# sourceMappingURL=BN.js.map