import { Contract, Context, Transaction } from 'fabric-contract-api'

export class Depository extends Contract {

    constructor() {
        super('Depository');
    }
    async unknownTransaction(ctx){
        throw new Error('a custom error message')
    }

    async beforeTransaction(ctx){
        console.log(`beforeTransaction`);
        console.info(`Transaction ID: ${ctx.stub.getTxID()}`);
    }

    async afterTransaction(ctx,result){
        // log result to preferred log implementation
        // emit events etc...
        console.log(`clean crime scene...`);
    }
    @Transaction()
    async addMark(ctx: Context,  mark: string) {
        const result = { code: 200, data: {}, message: '', error: '' };
        try {
            const cid = ctx.clientIdentity;
            const cidAttrValue = cid.getAttributeValue('customizedRole');
            console.log(`customizedRole: ${cidAttrValue}`);
            const isAuthorized = cid.assertAttributeValue('customizedRole', 'contract-coordinator');

            console.log(`Adding mark....`);
            const txId = ctx.stub.getTxID();
            await ctx.stub.putState(txId, Buffer.from(mark));
            result.code = 200;
            result.message = `Mark has been added successfully.`;
            result.data['txID'] = txId;
        } catch (e) {
            console.error(e.toString());
            result.code = 500;
            result.error = `unexpected error: ${e.toString()}`;
            result.message = `Unexpected error happened.`;
        } finally {
            return JSON.stringify(result);
        }
    }
    @Transaction(false)
    async queryByTX(ctx: Context, txID: string) {
        const result = { code: 200, data: {}, message: '', error: '' };
        try {
            const stateAsBytes = await ctx.stub.getState(txID);
            if (!stateAsBytes || stateAsBytes.byteLength === 0) {
                console.log(`State with key ${txID} does not exist.`);
                result.code = 404;
                result.message = 'failed to query state';
                result.error = `state with key ${txID} does not exist.`
            } else {
                result.code = 200;
                result.message = `query state successfully.`;
                result.data['state'] = stateAsBytes.toString();
            }
        } catch (e) {
            console.error(e.toString());
            result.code = 500;
            result.error = `unexpected error: ${e.toString()}`;
            result.message = `Unexpected error happened.`;
        } finally {
            return JSON.stringify(result);
        }
    }
}
