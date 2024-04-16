import type { Provider, Account, AbstractAddress, BytesLike, DeployContractOptions, StorageSlot } from "fuels";
import type { ProxyAbi, ProxyAbiInterface } from "../ProxyAbi";
export declare class ProxyAbi__factory {
    static readonly abi: {
        types: ({
            typeId: number;
            type: string;
            components: null;
            typeParameters: null;
        } | {
            typeId: number;
            type: string;
            components: {
                name: string;
                type: number;
                typeArguments: null;
            }[];
            typeParameters: null;
        } | {
            typeId: number;
            type: string;
            components: ({
                name: string;
                type: number;
                typeArguments: {
                    name: string;
                    type: number;
                    typeArguments: null;
                }[];
            } | {
                name: string;
                type: number;
                typeArguments: null;
            })[];
            typeParameters: number[];
        })[];
        functions: ({
            inputs: {
                name: string;
                type: number;
                typeArguments: null;
            }[];
            name: string;
            output: {
                name: string;
                type: number;
                typeArguments: null;
            };
            attributes: {
                name: string;
                arguments: string[];
            }[];
        } | {
            inputs: never[];
            name: string;
            output: {
                name: string;
                type: number;
                typeArguments: {
                    name: string;
                    type: number;
                    typeArguments: null;
                }[];
            };
            attributes: {
                name: string;
                arguments: string[];
            }[];
        } | {
            inputs: {
                name: string;
                type: number;
                typeArguments: {
                    name: string;
                    type: number;
                    typeArguments: null;
                }[];
            }[];
            name: string;
            output: {
                name: string;
                type: number;
                typeArguments: null;
            };
            attributes: {
                name: string;
                arguments: string[];
            }[];
        })[];
        loggedTypes: {
            logId: number;
            loggedType: {
                name: string;
                type: number;
                typeArguments: never[];
            };
        }[];
        messagesTypes: never[];
        configurables: {
            name: string;
            configurableType: {
                name: string;
                type: number;
                typeArguments: {
                    name: string;
                    type: number;
                    typeArguments: null;
                }[];
            };
            offset: number;
        }[];
    };
    static readonly storageSlots: StorageSlot[];
    static createInterface(): ProxyAbiInterface;
    static connect(id: string | AbstractAddress, accountOrProvider: Account | Provider): ProxyAbi;
    static deployContract(bytecode: BytesLike, wallet: Account, options?: DeployContractOptions): Promise<ProxyAbi>;
}
