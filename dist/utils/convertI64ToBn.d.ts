import { BN as FuelBN } from "fuels";
import BN from "./BN";
export declare const convertI64ToBn: (input: {
    value: FuelBN;
    negative: boolean;
}) => BN;
