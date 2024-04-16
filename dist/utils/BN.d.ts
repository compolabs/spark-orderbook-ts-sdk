import BigNumber from "bignumber.js";
import { Undefinable } from "tsdef";
type TValue = BN | BigNumber.Value;
declare class BN extends BigNumber {
    static ZERO: BN;
    static MaxUint256: string;
    dividedBy: (n: TValue, base?: Undefinable<number>) => BN;
    exponentiatedBy: (n: TValue, m?: Undefinable<TValue>) => BN;
    modulo: (n: TValue, base?: Undefinable<number>) => BN;
    multipliedBy: (n: TValue, base?: Undefinable<number>) => BN;
    squareRoot: () => BN;
    constructor(n: TValue, base?: number);
    static clamp(number: TValue, min: TValue, max: TValue): BN;
    static max(...n: TValue[]): BN;
    static min(...n: TValue[]): BN;
    static toBN(p: Promise<number | string>): Promise<BN>;
    static parseUnits(value: TValue, decimals?: number): BN;
    static formatUnits(value: TValue, decimals?: number): BN;
    static percentOf(value: TValue, percent: TValue): BN;
    static ratioOf(valueA: TValue, valueB: TValue): BN;
    abs(): BN;
    div(n: TValue, base?: Undefinable<number>): BN;
    pow(n: TValue, m?: Undefinable<TValue>): BN;
    minus(n: TValue, base?: Undefinable<number>): BN;
    mod(n: TValue, base?: Undefinable<number>): BN;
    times(n: TValue, base?: Undefinable<number>): BN;
    negated(): BN;
    plus(n: TValue, base?: Undefinable<number>): BN;
    sqrt(): BN;
    toDecimalPlaces(decimalPlaces: number, roundingMode?: BigNumber.RoundingMode): BN;
    toBigFormat(decimalPlaces: number): string;
    /**
     * @example
     * new BN('1234.5678').toSignificant(2) === 1,234.56
     * new BN('1234.506').toSignificant(2) === 1,234.5
     * new BN('123.0000').toSignificant(2) === 123
     * new BN('0.001234').toSignificant(2) === 0.0012
     */
    toSignificant: (significantDigits: number, roundingMode?: BigNumber.RoundingMode, format?: BigNumber.Format) => string;
    clamp(min: TValue, max: TValue): BN;
}
export default BN;
