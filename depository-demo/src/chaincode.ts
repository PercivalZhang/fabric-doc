import * as shim from 'fabric-shim';

export class Depository {
    // Initialize the chaincode
    async Init(stub) {
        console.info('========= Init =========');
        const ret = stub.getFunctionAndParameters();
        console.info(ret);
        return shim.success(Buffer.from('Initialized Successfully!'));
    }

    async Invoke(stub) {
        const ret = stub.getFunctionAndParameters();
        console.info(ret);
        const method = this[ret.fcn];
        if (!method) {
            console.log('no method of name:' + ret.fcn + ' found');
            return shim.success();
        }
        console.log(`call method::${ret.fcn}: ${ret.params}`);
        try {
            const payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            console.error(err);
            return shim.error(err);
        }
    }

    async add(stub, args): Promise<Buffer> {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1');
        }

        const result: { [k: string]: any } = {};
        /**
         * 示范获取合约接口调用着身份
         * 调用cid.getAttributeValue(), 获取用户身份的具体属性值
         * eg. 获取属性hf.role的值
         * cid.getAttributeValue('hf.role')
         * 调用cid.assertAttributeValue(属性名, 比较的目标值);
         * eg. 判断属性hf.role的值是否等于'admin'
         * cid.assertAttributeValue('hf.role', 'admin')
         *
         * 完整示例：属性hf.role不等于admin，拒绝访问当前接口
         * const cid = new ClientIdentity(stub);
         * if (!cid.assertAttributeValue('hf.role', 'admin')) {
         *   throw new Error('Unauthorized api access.');
         * }
         */
        const txId = stub.getTxID();
        console.log(`txId: ${txId}`);

        const stateAsBytes = await stub.getState(txId);
        if (stateAsBytes && stateAsBytes.byteLength !== 0) {
            throw new Error(`Duplicated category key - ${txId}.`);
        }

        await stub.putState(txId, Buffer.from(args[0]));

        result.code = 200;
        result.data = { txId };
        result.message = `state has been added successfully.`;

        console.log(`add: Ok`);
        return Buffer.from(JSON.stringify(result));
    }

    async query(stub, args): Promise<Buffer> {
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1');
        }
        const result: { [k: string]: any } = {};
        const keyOfState = args[0];

        const stateAsBytes = await stub.getState(keyOfState);
        if (!stateAsBytes || stateAsBytes.byteLength === 0) {
            console.log(`State with key ${keyOfState} does not exist.`);
            result.code = 404;
            result.message = 'failed to query state';
            result.error = `state with key ${keyOfState} does not exist.`;
        } else {
            result.code = 200;
            result.message = `query state successfully.`;
            result.data = { state: stateAsBytes.toString() };
        }

        console.log('query: OK');
        return Buffer.from(JSON.stringify(result));
    }
}

shim.start(new Depository());
