# 网络交互示范
目标测试网络：Fabric Sample示例代码中的first-network

本文档将演示如何通过client客户端docker容器与测试网络first-network进行交互操作。

## 1. 测试网络启动的docker容器应用列表

运行如下命令获取正在运行docker容器列表：
```
docker ps
```
结果如下图所示：
![image](https://github.com/PercivalZhang/fabric-doc/blob/master/resource/docker-ps.png)

从上图中提取的主要docker容器应用信息如下表所示：

**容器 id** | **容器名称** | **描述** 
---|---|---
acfb1b950c86 | cli | 客户端
9847f989e9ca | peer0.org2.example.com | 组织2节点0
72b780be5f33 | peer1.org2.example.com | 组织2节点1
c849d2a62d63 | peer0.org1.example.com | 组织1节点0
a22e2e5a5e51 | peer1.org1.example.com | 组织1节点1
22b9b18a8b1d | orderer.example.com    | solo排序节点

##  2.客户端docker容器
### 2.1 交互原理介绍
与测试网络的交互发生在客户端client和网络中的某个节点(peer/orderer)之间. 交互示意图如下所示：

```
graph LR
subgraph 客户端cli
    C[Client]
    U{Identity} -.bind.- C
    CT>Certificate] -.bind.- C
end
subgraph 测试网
    P0((Peer0))
    P1((Peer1))
    O1((Orderer01))
end
	C -->|Connect| P0
	C -->|Connect| O1
```
> **图例解说：** 

> * **Identity身份：** 与BTC等共网不同，Fabric网络是授权访问网络。只有预先被授权的用户才能访问该网络。
因此每个客户端都必须关联一个用户身份Identity；

> * **Certificate证书：** 通常为了安全，网络中的节点peer都会启动TLS加密链接，因此要连接节点，客户端还必须拿到对应节点的TLS证书；

> * **连接Peer节点：** 有些操作（状态查询/其他不改变链状态的操作）仅通过连接peer节点，在peer节点上就可以完成；

> * **连接Orderer节点：** 有些操作（状态修改）则需要连接排序orderer节点，通过orderer节点完成；

### 2.2 客户端容器CLI设定

测试网络first-network已经通过dock容器准备好了一个客户端：cli。上面解说提到的身份/证书/目标节点等都预先在docker容器CLI中设定好了。

打开目标文件：*/mnt/fabric/fabric-samples/first-network/docker-compose-cli.yaml*

如下所示，environment部分设定了当前docker容器的环境变量
```
environment:
      - SYS_CHANNEL=$SYS_CHANNEL
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      #- FABRIC_LOGGING_SPEC=DEBUG
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli
      - CORE_PEER_ADDRESS=peer0.org1.example.com:7051
      - CORE_PEER_LOCALMSPID=Org1MSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
```
参数介绍：
- CORE_PEER_ADDRESS
> 设定目标peer节点
- CORE_PEER_TLS_ENABLED
> 目标Peer节点启用了TLS，该变量设为true
- CORE_PEER_TLS_CERT_FILE
- CORE_PEER_TLS_KEY_FILE
- CORE_PEER_TLS_ROOTCERT_FILE
> 以上3个变量用来设定TLS证书链相关文件
- CORE_PEER_MSPCONFIGPATH
> 关联的身份Identity

可以看出默认设定的节点是:peer0.org1, 身份是Admin@org1.example.com. 如果想切换到其他的节点，比如切换到组织org2
的peer0节点，则需要修改如下的四个环境变量即可：
```
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp
CORE_PEER_ADDRESS=peer0.org2.example.com:9051
CORE_PEER_LOCALMSPID="Org2MSP"
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt
```
将上述设置复制到客户端容器命令行终端，回车即生效。如果希望仅对当前要执行的peer命令生效，则将要执行的命令添加到环境变量设置的末尾即可。

### 2.3 进入客户端容器
使用docker exec命令开启客户端容器交互。命令格式如下：

**命令格式**：docker exec -it <容器ID/容器名字> bash
> **参数说明：**

> * [-i]保持STDIN 打开

> * [-t]分配一个伪终端

> * [bash] 终端执行bash

运行如下docker exec命令进入客户端容器：
```
# 通过容器名字
docker exec -it cli bash

# 通过容器ID
# 注意讲id替换成实际的容器id
docker exec -it acfb1b950c86 bash
```

如果成功，新的终端提示符将显示如下：
```
root@acfb1b950c86:/opt/gopath/src/github.com/hyperledger/fabric/peer#
```


### 2.4 一般性交互命令

交互是通过peer命令发起，可用的子命令如下：
- **chaincode** 
> 操作合约链码: install | instantiate | invoke | package | query | signpackage | upgrade | list.
- **channel**  
> 操作通道channel：create｜fetch｜join | list | update | signconfigtx | getinfo
- **node**     
> 操作peer node：start｜status｜reset｜rollback
- **help**     
> 打印帮助
- **version**  
> 打印fabric peer版本

查看[官方文档peer command](https://hyperledger-fabric.readthedocs.io/en/release-1.4/commands/peercommand.html)获取更多信息。

#### 2.4.1 help命令
**命令格式**： *peer [sub command] help*
```
# Top顶级帮助
peer help

# 查看二级子命令帮助
# 查看子命令node相关帮助
peer node help

# 查看子命令channel相关帮助
peer channel help

# 查看子命令chaincode相关帮助
peer chaincode help
```
#### 2.4.2 查看当前连接节点的状态
```
peer node status
```
如果节点正常，显示结果如下：
```
status:STARTED
```

#### 2.4.3 查看当前节点已加入的通道列表
```
peer channel list
```
结果如下：
```
Channels peers has joined:
mychannel
```
#### 2.4.3 查看通道的最新区块信息
**命令格式**： *peer channel getinfo -c <channel name>*

查询通道mychannel的最新信息：
```
peer channel getinfo -c mychannel
```
结果如下：
```
2020-06-12 09:10:37.324 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
Blockchain info: {"height":5,"currentBlockHash":"bSJBme14JqJCaceFMA4NJUowEQQVL+DtyM91splWdqU=","previousBlockHash":"HtCMi++va+8sWUR9gr9gYySRJ9oAsh5DRlvhaBzExco="}
```
> **返回信息显示**：通道mychannel的区块高度5，当前区块哈希bSJBme14JqJCaceFMA4NJUowEQQVL，前一个区块哈希：HtCMi++va+8sWUR9gr9gYySRJ9oAsh5DRlvhaBzExco= 。区块从0开始，当前共出5个区块。

#### 2.4.3 查看通道上的某个区块信息
**命令格式**： *peer channel fetch <newest|oldest|config|(number)> -c <channel name>*

* 查询通道mychanne的最新区块详细信息：
```
peer channel fetch newest -c mychannel
```

* 通过块号查询通道mychannel的区块详细信息：
```
peer channel fetch 4 -c mychannel
```

结果如下：
```
2020-06-12 09:24:34.220 UTC [channelCmd] InitCmdFactory -> INFO 001 Endorser and orderer connections initialized
2020-06-12 09:24:34.222 UTC [cli.common] readBlock -> INFO 002 Received block: 4
```
提示最新区块号为4，该命令会自动将区块4的详细信息输出到当前目录下的一个文件，文静命名方式<channel name>_<block number>.block。

因此当前目录下将会新增一个文件 - mychannel_4.block。
```
channel-artifacts  crypto  mychannel_4.block  mychannel.block  mychannel_newest.block  scripts
```

可以通过运行如下命令查看区块的详细内容：
```
root@acfb1b950c86:/opt/gopath/src/github.com/hyperledger/fabric/peer# cat mychannel_4.block
```

#### 2.4.4 查询当前节点已安装的链码(智能合约)列表
**命令格式**： *peer chaincode list --installed*

运行命令, 查询当前连接的节点上已经安装的合约列表：
```
root@acfb1b950c86:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode list --installed
```
结果如下:
```
Get installed chaincodes on peer:
Name: mycc, Version: 1.0, Path: /opt/gopath/src/github.com/chaincode/chaincode_example02/node/, Id: 64ddd6fe098580edb3c74c2aff78514bbf80b936841791fad30142226556a9b6
```
通道名称/版本/安装目录/Id，一目了然。

#### 2.4.5 查询通道上已经实例化的的链码(智能合约)列表
**命令格式**： *peer chaincode list --instantiated -C <channel name>*

运行命令,查询通道mychannel上已经实例化的合约列表：
```
root@acfb1b950c86:/opt/gopath/src/github.com/hyperledger/fabric/peer# peer chaincode list --instantiated -C mychannel
```
结果如下:
```
Get instantiated chaincodes on channel mychannel:
Name: mycc, Version: 1.0, Path: /opt/gopath/src/github.com/chaincode/chaincode_example02/node/, Escc: escc, Vscc: vscc
```

### 2.5 chaincode链码/合约交互命令

客户端通过peer chaincode 命令与peer和orderer进行合约交互示意图如下：
```
graph LR
    subgraph peer
       P(install chaincode)
       CC(chaincode)
    end
    subgraph orderer
       II(instantiate chaincode)
       UU(upgrade chaincode)
    end
	Client[Client] -->|install| P
	Client[Client] -->|invoke| CC
	Client[Client] -->|query| CC
	
	Client[Client] -.instantiate.-> II
	Client[Client] -.upgrade.-> UU

```

合约的交互是最常用和最重要的功能，合约的交互操作主要有如下几个场景：
1. 安装合约 - *install*
2. 实例化合约 - *instantiate*
3. 合约写入调用 - *invoke*
4. 合约只读查询 - *query*
5. 合约升级 - *upgrade*

#### 2.5.1 合约安装
命令格式: 

*peer chaincode install -n <chaincode name> -v <version numbner> -l <chaincode language> -p <chaincode source path>*

例如测试网的合约mycc安装命令:
>安装chaincode，命名为mycc，版本1.0，合约语言：node，合约代码路径：/opt/gopath/src/github.com/chaincode/chaincode_example02/node/
```
peer chaincode install -n mycc -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/chaincode_example02/node/
```
> 当合约代码修改后，需要重新在节点上安装新版合约，其他参数不变，只需要更新版本号码即可。

#### 2.5.2 合约实例化

合约实例化在合约整个生命周期里，发生在合约代码首次安装部署的时候，并且只调用一次。

命令格式: 

* 排序节没启动TLS:

> *peer chaincode instantiate -o <排序节点服务URI> -C <channel name> -n <chaincode name> -v <版本号> -c <参数列表> -P <背书策略>*

* 排序节点启动了TLS:

> *peer chaincode instantiate -o <排序节点服务URI> --tls --cafile <tls证书路径> -C <channel name> -n <chaincode name> -v <版本号> -c <参数列表> -P <背书策略>*

例如测试网的合约mycc实例化命令:
```
peer chaincode instantiate -o orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n mycc -l node -v 1.0 -c '{"Args":["init","a", "100", "b","200"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer')"
```

关于背书策略相关的详细信息，可参考[官方文档：背书策略](https://hyperledger-fabric.readthedocs.io/en/release-1.4/endorsement-policies.html?highlight=endorsement%20policy)。

#### 2.5.3 合约只读查询调用query
命令格式: 

*peer chaincode query -C <通道名称> -n <chaincode名字/ID> -c <参数列表>*

例如测试网中的合约mycc查询命令:
>调用通道mychannel上命名为mycc的合约的查询接口：接口名称为query，接口输入参数为"a".
```
peer chaincode query -C mychannel -n mycc -c '{"Args":["query","a"]}'
```

该查询将返回变量a的值，例如：
```
90
```

#### 2.5.4 合约写入调用invoke
合约实例化的时候，设定了背书策略: 要求指定的背书节点进行交易背书。因此进行合约写入操作的时候，必须按照背书策略的要求，向满足背书策略要求的节点发起交易请求。

命令格式: 

* 排序节没启动TLS:

> *peer chaincode invoke -o <排序节点服务URI> -C
<通道名称> -n <chaincode名字/ID> <peer节点链接列表> -c <参数列表>*

* 排序节启动TLS:

> *peer chaincode invoke -o <排序节点服务URI> --tls --cafile <排序节点tls证书路径> -C
<通道名称> -n <chaincode名字/ID> <peer节点链接列表> -c <参数列表>*

例如测试网的合约mycc写入调用命令:
> 向两个节点peer0.org1和peer0.org2发起合约调用请求，请求调用通道mychannel上名字为mycc的合约的写入接口:接口名字:invoke，接口参数列表:"a","b","10". 接口invoke执行a减10，b加10的操作。
```
peer chaincode invoke -o orderer.example.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem -C mychannel -n mycc --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses peer0.org2.example.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt -c '{"Args":["invoke","a","b","10"]}'
```
执行成功结果如下:
```
2020-06-15 03:42:33.060 UTC [chaincodeCmd] chaincodeInvokeOrQuery -> INFO 001 Chaincode invoke successful. result: status:200
```

如何想进一步确认结果，可以调用query对变量a和b分别进行查询，看是否发生了变化。

#### 2.5.5 合约升级

在2.5.2中，提到了合约实例化，合约升级命令格式基本跟实例化相同，不同的是，实例化只发生一次，而合约升级则可以执行多次。

每次当合约代码更新后，都需要相应的节点（背书节点）重新安装新版本的合约。在所有背书节点安装完成新版合约后，需要执行一次合约升级命令。

命令格式: 

* 排序节没启动TLS:

> *peer chaincode upgrade -o <排序节点服务URI> -C <channel name> -n <chaincode name> -v <版本号> -c <参数列表> -P <背书策略>*

* 排序节点启动了TLS:

> *peer chaincode upgrade -o <排序节点服务URI> --tls --cafile <tls证书路径> -C <channel name> -n <chaincode name> -v <版本号> -c <参数列表> -P <背书策略>*

例如测试网的合约mycc将版本升级为1.2的命令:
```
# 设定环境变量，减少输入的工作量
export ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem

peer chaincode upgrade -o orderer.example.com:7050 --tls --cafile $ORDERER_CA -C mychannel -n mycc -v 1.2 -c '{"Args":["init","a","100","b","200","c","300"]}' -P "AND ('Org1MSP.peer','Org2MSP.peer')"
```

关于peer chaincode的详细介绍，可以查看[官方文档-peer chaincode](https://hyperledger-fabric.readthedocs.io/en/release-1.4/commands/peerchaincode.html)。
