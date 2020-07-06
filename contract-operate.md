## 1. 进入命令行客户端
与链交互必须通过客户端进行，每个客户端都会关联一个用户身份。

运行如下命令，进入命令行客户端:
```
docker exec -it cli bash
```
> cli客户端关联组织org1.example的用户Admin

运行成功后，进入客户端console，提示符如下/opt/gopath/src/github.com/hyperledger/fabric/peer#. 

如没有特殊注明，一下所有命令都是在该提示符下运行。

## 2. 设置必要的环境变量

```
export CHANNEL_NAME=mychannel # 设置通道名称
export CONTRACT_NAME=demo     # 设置链码合约名称
```
## 3. 安装chaincode合约
可以在同一个客户端命令行下，通过环境变量切换不同的节点和身份，实现在多个节点上安装chaincode

> fabric的chaincode不需要安装在所有节点上，在这里设定背书策略：要求该chaincode的交易需要每个组织的一个节点背书；这样该背书策略要求每个组织选取一个节点安装chaincode就可以了。安装了chaincode的节点就是该chaincode的背书节点了。

将存证Demo智能合约release目录下的代码copy到如下路径： ～/fabric/fabric-samples/chaincode/demo

该路径下文件结构如下：

```
chaincode.js  npm-shrinkwrap.json  package.json
```
下面列举了在四个不通节点上，安装chaincode的shell命令。可以选取分别从两个组织中选取一个节点进行安装。

### 3.1 当前节点peer0.org1.example.com:7051 安装chaincode
```
peer chaincode install -n ${CONTRACT_NAME} -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo/
```

安装成功，提示如下:
```
2020-07-06 09:24:55.361 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 001 Using default escc
2020-07-06 09:24:55.361 UTC [chaincodeCmd] checkChaincodeCmdParams -> INFO 002 Using default vscc
2020-07-06 09:24:55.366 UTC [chaincodeCmd] install -> INFO 003 Installed remotely response:<status:200 payload:"OK" >
```

### 3.2 节点peer1.org1.example.com 安装chaincode
```
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp CORE_PEER_ADDRESS=peer1.org1.example.com:8051 CORE_PEER_LOCALMSPID="Org1MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt peer chaincode install -n $CONTRACT_NAME -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo
```

### 3.3 peer0.org2.example.com 安装chaincode
```
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer0.org2.example.com:9051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt peer chaincode install -n $CONTRACT_NAME -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo
```

### 3.4 peer1.org2.example.com 安装chaincode
```
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer1.org2.example.com:10051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt peer chaincode install -n $CONTRACT_NAME -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo
```

## 4. chaincode实例化
```
peer chaincode instantiate -o orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt -C $CHANNEL_NAME -n $CONTRACT_NAME -l node -v 1.0 -c '{"Args":[]}' -P "AND('Org1MSP.member','Org2MSP.member')"
```

## 5. 调用链码 - 写入操作
> 调用合约的add方法，向链上写入一个状态
```
peer chaincode invoke -o orderer.example.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -C $CHANNEL_NAME -n $CONTRACT_NAME -c '{"Args":["add","dffdgh"]}'
```

## 6. 查询链码 - 只读操作
peer chaincode query -C $CHANNEL_NAME -n $CONTRACT_NAME -c '{"Args":["query","e31729f5bfb1e5eb656343a12c35ad7461ae7e1f14d0c51fa8f923908600f824"]}'
