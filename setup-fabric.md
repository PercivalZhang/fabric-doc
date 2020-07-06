# Fabric 环境安装

## 目标主机OS版本
ubuntu

## Fabric版本
1.4

## 官方文档
阅读[1.4环境搭建文档](https://hyperledger-fabric.readthedocs.io/en/release-1.4/install.html)

## 详细步骤
操作根目录：/mnt/fabric

项目github地址：https://github.com/hyperledger/fabric-samples

项目代码仓库git地址: https://github.com/hyperledger/fabric-samples.git

### 1. 克隆fabric-sample代码
1.1 安装git
```
apt install git
```


1.2 代码克隆
```
# 进入操作目录
cd /mnt/fabric

# clone git repo
git clone https://github.com/hyperledger/fabric-samples.git 
```

执行完毕后，如下图所示则标志clone完成：

![截屏2020-06-10 下午5.57.59.png](http://note.youdao.com/yws/res/3108/WEBRESOURCEfb16990d01e60a11c47458d8d1911aeb)

### 2. 检出相应版本的分支代码
git clone默认检出master主分支，由于我们选取的fabric版本是1.4.4，所以我们需要检出对应分支：**release-1.4**。

#### 2.1 查看当前分支
```
# 进入代码根目录
cd /mnt/fabric/fabric-samples

# 查看当前分支, 默认master
git branch
```

#### 2.2 检出指定分支: release-1.4
```
git checkout release-1.4
```

#### 2.3 查看当前分支, 确认分支检出并切换成功
```
git branch
```
成功如下图所示：

![截屏2020-06-10 下午6.24.28.png](http://note.youdao.com/yws/res/3131/WEBRESOURCEea1ae4befeb9cae18fbbb8ac54248b54)

### 3. 安装Fabric

下载命令说明：
```
curl -sSL http://bit.ly/2ysbOFE | bash -s -- <fabric_version> <fabric-ca_version> <thirdparty_version>
```
> 参数说明

- [fabric_version] fabric版本号
- [fabric-ca_version] fabric ca版本号
- [thirdparty_version] 第三方依赖版本号

下载过程如下：
- 下载hyperledger-fabric binaries
- 下载fabric-ca binaries
- 下载各种docker镜像images

由于需要下载docker镜像，所以要提前安装docker环境。

#### 3.1 安装docker/docker-compose环境;

运行如下命令, 安装docker环境：
```
# 安装docker
apt install docker.io

# 确认docker安装成功
docker -v
```

运行如下命令, 安装docker-compose环境：
```
apt install docker-compose

# 确认docker安装成功
docker-compose -v
```
#### 3.2 下载1.4版本的Fabric/Fabric-ca binaries和images;

运行如下命令：
```
curl -sSL http://bit.ly/2ysbOFE | bash -s -- 1.4.7 1.4.7 0.4.20
```

如果在运行上述curl命令时发生错误，比如发生如下错误：

> curl: (56) Recv failure: Connection reset by peer

请访问[Prerequisites页面](https://hyperledger-fabric.readthedocs.io/en/release-1.4/prereqs.html)，获取如何安装最新版的curl软件；另外一个解决方案就是直接使用脚本[bootstrap.sh](https://raw.githubusercontent.com/hyperledger/fabric/master/scripts/bootstrap.sh).

#### 3.3 bootstrap.sh脚本
该脚本将完成与curl命令相同的事情，仅适用于curl命令失败的情况。
```
cd /mnt/fabric

vim bootstrap.sh

# 拷贝bootstrap.sh内容至vim打开的文件bootstrap.sh中

# vim 保存退出

# 给脚本添加执行权限
chmod u+x bootstrap.sh

# 执行脚本
./bootstrap.sh 1.4.7 1.4.7 0.4.20 -s
```

耐心等待整个下载任务完成。
下载完成后，运行如下命令查看一下当前目录：*/mnt/fabric*
```
ls
```
当前目录内容如下图所示：

![截屏2020-06-12 上午10.46.33.png](http://note.youdao.com/yws/res/3452/WEBRESOURCE03ce15b675479308c0f38dc35fd2f509)

#### 3.4 安装收尾
安装结束后，以下二进制程序将被安装bin目录（/mnt/fabric/bin）下：
* configtxgen,
* configtxlator,
* cryptogen,
* discover,
* idemixgen,
* orderer,
* peer,
* fabric-ca-client,
* fabric-ca-server

为了后面使用方便，将该bin路径添加到系统环境变量PATH中，这样子在后续的调用中就不需要提供全路径了。

##### 3.4.1 修改环境变量PATH

通过编辑用户根目录下文件.bashrc来实现。
```
# vim 修改用户根目录下文件.bashrc
vim ~/.bashrc
```
在文件最末尾添加一行：
```
export PATH="$PATH:/mnt/fabric/bin"
```
保存退出。


运行如下命令，让修改立即生效。
```
source ~/.bashrc
```

检查PATH，确认修改成功(/mnt/fabric/bin将出现在PATH变量值的末尾)。
```
echo $PATH
```

##### 3.4.1 查看Fabric相关的docker镜像

运行如下命令查看上面命令安装的所有相关镜像。
```
docker images | grep hyperledger
```
镜象列表如下图所示：

![截屏2020-06-11 下午2.37.54.png](https://note.youdao.com/src/WEBRESOURCE68a9363cb2df3b6dab76e5a1325924ec)


#### 3.5 其他
如果想要在目标主机上编写/调试Fabric chaincode合约，还需要安装与合约语言对应的开发环境。
* go语言开发环境
* node.js语言开发环境
* java开发环境

