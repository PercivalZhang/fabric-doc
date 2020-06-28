import { Contract, Context } from 'fabric-contract-api';
export declare class Depository extends Contract {
    constructor();
    unknownTransaction(ctx: any): Promise<void>;
    beforeTransaction(ctx: any): Promise<void>;
    afterTransaction(ctx: any, result: any): Promise<void>;
    addMark(ctx: Context, mark: string): Promise<string>;
    queryByTX(ctx: Context, txID: string): Promise<string>;
}
