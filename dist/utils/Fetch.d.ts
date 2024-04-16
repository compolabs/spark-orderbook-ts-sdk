import { Nilable } from "tsdef";
export declare class Fetch {
    private url;
    constructor(url: string);
    private request;
    protected post: <T>(endpoint: string, body: Record<string, any>, credentials?: RequestCredentials) => Promise<T>;
    protected get: <T>(endpoint: string, params?: Record<string, Nilable<string | number>>) => Promise<T>;
}
