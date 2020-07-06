# 第一个网络搭建

查看：[官方参考文档](https://hyperledger-fabric.readthedocs.io/en/release-1.4/build_network.html)

前面克隆的官方示例代码fabric-samples仓库中提供了很多例子，以first-network这个例子为例。

首先进入first-network这个目录：
```
cd ~/fabric/fabric-samples/first-network
```
这篇文档后续的命令都必须在该目录下运行。

## 1. 启动脚本*byfn.sh*介绍

官方示例提供了一个注释丰富的shell脚本。该脚本完成如下主要功能：
- 准备网络成员，包括两个组织，每个组织由两个节点构成；
- 创建节点docker镜像；
- 启动所有节点docker容器；
- 创建一个通道；
- 将通道内组织的节点peer都加入通道；
- 部署并实例化一个智能合约；
- 调用合约进行状态的读写；

### 1.1 打印help
运行如下命令查看脚本帮助：
```
./byfn.sh -h
```

### 1.2 主要参数介绍
- [**up**] 启动网络
- [**down**] 关闭网络
- [**-c**] 通道名称，默认mychannel。
- [**-l**] 合约语言，默认go语言。
- [**-o**] 指定排序方式，默认solo。

### 1.3 启动网络

测试网络规格：
- **合约语言**：*node*
- **排序服务**：*solo*
- **通道名称**：*mychannel*

运行如下命令，启动上述规格的测试网络。
```
# use the -l flag to specify the chaincode language - node.js
# forgoing the -l flag will default to Golang

./byfn.sh up -l node
```

Fabric合约语言支持：
> Fabric合约支持三种编程语言：go / node.js / java。

> Go语言是默认支持的合约语言，如果希望支持其他语言，必须通过-l参数指定相应的语言。

除了支持多种语言外，示例网络支持三种排序服务：Solo / Raft / Kafka。默认选择的排序是solo。

如果希望使用其他排序方式，可以通过参数-o来指定相应的排序方式。

例如：启动Raft排序服务的网络
```
./byfn.sh up -l node -o etcdraft
```

例如：启动Kafka排序服务的网络
```
./byfn.sh up -l node -o kafka
```

如果想了解Fabric支持的排序服务的细节，可以查看官方文档[The Ordering Service](https://hyperledger-fabric.readthedocs.io/en/release-1.4/orderer/ordering_service.html).


运行完启动命令后，命令行将提示是否继续还是放弃。输入大写Y，并敲击回车，执行结果如下图：
```
Starting for channel 'mychannel' with CLI timeout of '10' seconds and CLI delay of '3' seconds
Continue? [Y/n] Y
proceeding ...
LOCAL_VERSION=1.4.7
DOCKER_IMAGE_VERSION=1.4.7
~/fabric/bin/cryptogen

##########################################################
##### Generate certificates using cryptogen tool #########
##########################################################
```

脚本将从这里开始，自动完成所有的准备工作，并最终启动所有docker容器，然后驱动起一个端到端的应用场景。

如果一切OK，终端terminal应该会打印如下日志：
```
========= All GOOD, BYFN execution completed ===========


 _____   _   _   ____
| ____| | \ | | |  _ \
|  _|   |  \| | | | | |
| |___  | |\  | | |_| |
|_____| |_| \_| |____/
```

### 1.4 关闭网络

运行如下命令关闭整个测试网络。
- 杀掉所有的docker容器
- 删除加密材料和通道产物
- 删除合约镜像

```
./byfn.sh down
```

运行之后，终端terminal命令行弹出是否继续还是放弃的提示，输入Y，敲击回车enter继续关闭。
