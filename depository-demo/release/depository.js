"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
const fabric_contract_api_1 = require("fabric-contract-api");
class Depository extends fabric_contract_api_1.Contract {
    constructor() {
        super('Depository');
    }
    async unknownTransaction(ctx) {
        throw new Error('a custom error message');
    }
    async beforeTransaction(ctx) {
        console.log(`beforeTransaction`);
        console.info(`Transaction ID: ${ctx.stub.getTxID()}`);
    }
    async afterTransaction(ctx, result) {
        console.log(`clean crime scene...`);
    }
    async addMark(ctx, mark) {
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
        }
        catch (e) {
            console.error(e.toString());
            result.code = 500;
            result.error = `unexpected error: ${e.toString()}`;
            result.message = `Unexpected error happened.`;
        }
        finally {
            return JSON.stringify(result);
        }
    }
    async queryByTX(ctx, txID) {
        const result = { code: 200, data: {}, message: '', error: '' };
        try {
            const stateAsBytes = await ctx.stub.getState(txID);
            if (!stateAsBytes || stateAsBytes.byteLength === 0) {
                console.log(`State with key ${txID} does not exist.`);
                result.code = 404;
                result.message = 'failed to query state';
                result.error = `state with key ${txID} does not exist.`;
            }
            else {
                result.code = 200;
                result.message = `query state successfully.`;
                result.data['state'] = stateAsBytes.toString();
            }
        }
        catch (e) {
            console.error(e.toString());
            result.code = 500;
            result.error = `unexpected error: ${e.toString()}`;
            result.message = `Unexpected error happened.`;
        }
        finally {
            return JSON.stringify(result);
        }
    }
}
__decorate([
    fabric_contract_api_1.Transaction(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], Depository.prototype, "addMark", null);
__decorate([
    fabric_contract_api_1.Transaction(false),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [fabric_contract_api_1.Context, String]),
    __metadata("design:returntype", Promise)
], Depository.prototype, "queryByTX", null);
exports.Depository = Depository;
//# sourceMappingURL=depository.js.map