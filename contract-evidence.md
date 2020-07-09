# 存证合约
## 什么是存证
保存数据并防止篡改，这就是存证。从文化传承，到司法，到民生，到金融，每一个领域都需要存证。

## 传统存证
以往是如何存证的？有将纸质材料严密保存的档案馆，有多重备份的数据中心，但它们的维护成本都非常高。更大的缺陷是，一个外人无法独立验证数据有没有被篡改过，只能依赖对存证机构的信任。

## 区块链存证
利用块链式数据结构来验证与存储数据、利用分布式节点共识算法来生成和更新数据、利用密码学的方式保证数据传输和访问的安全、利用由自动化脚本代码组成的智能合约来编程和操作数据的一种全新的分布式基础架构与计算范式。简单来说， 在区块链系统中， 每过一段时间， 各个参与主体产生的交易数据会被打包成一个数据区块， 数据区块按照时间顺序依次排列， 形成数据区块的链条，各个参与主体拥有同样的数据链条， 且无法单方面篡改，任何信息的修改只有经过约定比例的主体同意方可进行，并且只能添加新的信息，无法删除或修改旧的信息，从而实现多主体间的信息共享和一致决策， 确保各主体身份和主体间交易信息的不可篡改、 公开透明。

## 存证合约

### 什么是合约
chaincode是一个程序，它是使用Go/Node/Java语言编写的，实现了指定的接口。chaincode运行在一个被背书peer进程独立出来的安全的Docker容器中。chaincode通过应用程序提交的事务初始化和管理账本状态。

chaincode通常处理被网络成员认可的业务逻辑，因此它被认为是一种“智能合约”。

## 存证合约
存证合约负责接收数据，并将其写入到区块链上。

## 存证合约Demo

从一个简单的存证合约入手，诠释Fabric合约是什么样子，怎么将数据写入到区块链上，怎么从链上查询数据。

Fabric 合约支持三种语言Go/Node/Java，本例子中的合约采用Node.js编写。

Fabric官方提供了两种开发node.js链码的途径：
- fabric-shim
> fabric-shim是较底层的链码开发包，它封装了与节点通信的grpc协议。它直接把链码接口暴露给开发者，虽然简单直白，但如果要实现相对复杂一点的链码，开发者需要自己在Invoke实现中进行方法路由。
- fabric-contract-api。
> fabric-contract-api则是更高层级的封装，开发者直接继承开发包提供的Contract类，就不用费心合约方法路由的问题了。

本示例Demo采用fabric-shim框架编写。如果对fabric-contract-api感兴趣，可以[点击查看详细信息](https://www.npmjs.com/package/fabric-contract-api)。

### 合约
合约的源代码目录如下：
```
src
- chaincode.ts
```
- chaincode.ts 合约文件
> 合约逻辑实现代码

为了使得合约能够可运行，必须安装fabric-shim模块，因此一定要在package.json文件中，添加fabric-shim到依赖列表并添加start命令到scripts列表，具体内容如下：
```
"scripts": {  
  "start": "node chaincode.js"  
},
"dependencies": {  
    "fabric-shim": "^2.0.0"
},
```

### 存证合约基本结构

一个典型的使用fabric-shim框架编写的合约代码的基本结构如下：
```typescript
// 引用相应的模块
import * as shim from 'fabric-shim';

export class Depository {
    // 链码初始化
    async Init(stub) {
        console.info('========= Init =========');
        const ret = stub.getFunctionAndParameters();
        console.info(ret);
        return shim.success(Buffer.from('Initialized Successfully!'));
    }
    // 接口方法路由转发, 使用fabric-shim库，必须实现该方法，实现自定义方法的跳转
    async Invoke(stub) {
        // 获取该类的所有方法和参数
        const ret = stub.getFunctionAndParameters();
        console.info(ret);
        const method = this[ret.fcn];
        // 目标方法不存在
        if (!method) {
            console.log('no method of name:' + ret.fcn + ' found');
            return shim.success();
        }
        console.log(`call method::${ret.fcn}: ${ret.params}`);
        try {
            // 调用目标方法
            const payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            console.error(err);
            return shim.error(err);
        }
    }
    // 自定义接口
    async add(stub, args): Promise<Buffer> {

    }
    // 自定义接口
    async query(stub, args): Promise<Buffer> {

    }
}

shim.start(new Depository());
```
上面的合约示例定义了两个接口：
- add：写入数据
- query：查询数据

### Transaction Context交易上下文

交易上下文执行两个功能：
- 允许开发者定义和维护一个智能合约内横跨交易调用周期的用户变量
- 提供丰富的api，允许开发者执行交易相关的操作
  * 查询账本
  * 更新账本
  * 获取交易提交者的数字身份信息

交易上下文context提供了2个内嵌的元素，这两个元素给开发者提供了丰富的API：
- stub
> putState(): 写入状态   
> getState(): 读取状态   
> getTxID(): 获取当前交易ID
- clientIdentity
> 获取交易提交者的数字身份，用于接口级别的精确权限控制

在下面的示例中，将展示如何通过交易上下文进行账本状态查询/更新账本状态/获取数字身份。

### 如何写入数据
接下来展示如何向区块链写入一条数据。仍然以上面的代码为例，对接口add进行如下拓展：
```typescript
async add(stub, args: string[]): Promise<Buffer> { 
  // 通常会对输入参数的数量做一个数检查，已减少不必要的计算资源浪费
  if (args.length !== 1) {
    // 抛出Error，返回失败响应
    throw new Error('Incorrect number of arguments. Expecting 1');
  }
 
  // 调用交易上下文的clientIdentity,获取交易提交者的数字身份
  const cid = new ClientIdentity(stub);
  
  /**
   * 示范合约调用者身份属性验证
   *
   * 调用cid.getAttributeValue(), 获取用户身份的具体属性值
   * eg. 获取属性hf.role的值
   * cid.getAttributeValue('hf.role');
   *
   * 调用cid.assertAttributeValue(属性名, 比较的目标值);
   * eg. 判断属性hf.role的值是否等于'admin'
   * cid.assertAttributeValue('hf.role', 'admin');
   */

            
  // 调用stub.getTxID(),获取当前交易的交易ID 
  const txId = stub.getTxID(); 
  
  // 调用stub.putState()
  // 用交易ID做key，将输入字符串转换为Buffer后，写入到状态数据库 
  await stub.putState(txId, Buffer.from(args[0]));  
  
  // 返回交易ID 
  return Buffer.from(txId);
}
```
> 链存储的就是各种状态，状态state是一个key-value数据库。key值是字符串类型，具备唯一性；value存储Buffer类型的数据。
> 
> 在本例子中，通过调用putState()，使用了交易ID作为key，将输入的param字符串Buffer写入到状态数据库。
> 
> 通常为了查询方便，我们会将key值返回。

### 如何读取数据
接下来展示如何从区块链读取一条数据。仍然以上面的代码为例，对接口quey进行如下拓展：
```typescript
async query(stub, args: string[]): Promise<Buffer> {    
  // 通常会对输入参数的数量做一个数检查，已减少不必要的计算资源浪费
  if (args.length !== 1) {
    // 抛出Error，返回失败响应
    throw new Error('Incorrect number of arguments. Expecting 1');
  }
  // 声明一个结果对象，用于保存结果
  const result: { [k: string]: any } = {};
  // 状态的key值
  const keyOfState = args[0];
  // 调用交易上下文stub.getState(), 传入key值，查询对应的状态 
  const stateAsBytes = await stub.getState(keyOfState);  
  // 判断查询的结果是否为空，或者长度为0
  // 返回消息，提示与key对应的状态不存在
  if (!stateAsBytes || stateAsBytes.byteLength === 0) {  
      console.log(`State with key ${keyOfState} does not exist.`);
      result.code = 404;
      result.message = 'failed to query state';
      result.error = `state with key ${keyOfState} does not exist.`;
  } else {  
    // 状态存在
    result.code = 200;
    result.message = `query state successfully.`;
    result.data = { state: stateAsBytes.toString() };
  }
  console.log('query: OK');
  return Buffer.from(JSON.stringify(result));
}  
```
> 在本例子中，通过调用getState()，传入输入参数args[0]作为key，查询对应的状态。
>
>可以将add接口返回的交易ID，作为输入参数传入query接口，进行状态查询。

## 完整存证合约Demo


[点击查看完整Demo](https://github.com/PercivalZhang/fabric-doc/tree/master/depository-demo)
