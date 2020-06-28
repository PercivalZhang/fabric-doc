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

本示例Demo采用fabric-contract-api框架编写。如果对fabric-contract-api感兴趣，可以[点击查看详细信息](https://www.npmjs.com/package/fabric-contract-api)。

### 合约
合约的源代码目录如下：
```
src
- depository.ts
- index.ts
```
- depository.ts 合约文件
> 合约逻辑实现代码
- index.ts 合约注册表文件
> 合约导出注册

为了使得合约能够可运行，必须安装fabric-shim模块，因此一定要在package.json文件中，添加fabric-shim到依赖列表并添加start命令到scripts列表，具体内容如下：
```
"scripts": {  
  "start": "fabric-chaincode-node start"  
},
"dependencies": {  
  "fabric-contract-api": "^2.0.0",  
  "fabric-shim": "^2.1.2",  
  "winston": "^3.2.1"  
},
```

### 存证合约基本结构
使用fabric-contract-api的合约代码，除了构造函数之外的每个方法都自动称为链码的方法，可供外部应用调用 。

一个典型的使用fabric-contract-api框架编写的合约代码的基本结构如下：
```typescript
// 引用相应的模块
import { Contract, Context } from 'fabric-contract-api'  
// 继承Contract类  
export class Depository extends Contract {  
  // 构造函数
  constructor() {
    super('Depository');  
  }    
  /* 注解@Transaction()：标明该接口是一个写入数据的接口
   * Context交易上下文：逻辑代码的关键
   * param：接口参数，一个或者多个
   */
  @Transaction()
  async add(ctx: Context, param: string) {  
    ...
  }  
   /* 注解@Transaction(false)：标明该接口是一个查询的只读的接口
   * Context交易上下文：逻辑代码的关键
   * param：接口参数，一个或者多个
   */
  @Transaction(false)
  async query(ctx: Context, param: string) {       
    ...   
  }  
}
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
- ctx.stub
> putState(): 写入状态   
> getState(): 读取状态   
> getTxID(): 获取当前交易ID
- ctx.clientIdentity
> 获取交易提交者的数字身份，用于接口级别的精确权限控制

在下面的示例中，将展示如何通过交易上下文进行账本状态查询/更新账本状态/获取数字身份。

### 如何写入数据
接下来展示如何向区块链写入一条数据。仍然以上面的代码为例，对接口add进行如下拓展：
```typescript
@Transaction()
async add(ctx: Context, param: string) { 
  // 调用交易上下文ctx.clientIdentity,获取交易提交者的数字身份
  const cid = ctx.clientIdentity;
  
  // 调用数字身份的getAttributeValue(), 获取数字身份中的各种属性值
  const cidAttrValue = cid.getAttributeValue('customizedRole');
            
  // 调用交易上下文ctx.stub.getTxID(),获取当前交易的交易ID 
  const txId = ctx.stub.getTxID(); 
  
  // 交易上下文ctx.stub.putState()
  // 用交易ID做key，将输入字符串转换为Buffer后，写入到状态数据库 
  await ctx.stub.putState(txId, Buffer.from(param));  
  
  // 返回交易ID 
  return txId;
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
@Transaction(false)
async query(ctx: Context, param: string) {      
  // 调用交易上下文ctx.getState(), 传入key值，查询对应的状态 
  const stateAsBytes = await ctx.stub.getState(param);  
  // 判断查询的结果是否为空，或者长度为0
  // 返回消息，提示与key对应的状态不存在
  if (!stateAsBytes || stateAsBytes.byteLength === 0) {  
      console.log(`State with key ${param} does not exist.`);
      return `state with key ${param} does not exist.`;
  } else {  
    // 否则，与key对应的状态存在，将Buffer转换为字符串返回
    return stateAsBytes.toString();  
  }
}  
```
> 在本例子中，通过调用getState()，传入输入参数param作为key，查询对应的状态。
>
>可以将add接口返回的交易ID，作为输入参数传入query接口，进行状态查询。
