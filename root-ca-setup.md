# Root CA和TLS CA搭建
当前工作目录：/mnt/data/application/Fabric-CA

## 1. 初始化CA服务器
**命令格式**：*fabric-ca-server init -b [username]:[passwd] --home [root_dir]*
- [-b]: 指定boostrap用户名和密码
- [--home]：制定CA服务器根目录

> 假定两个CA服务器Boostrap用户名和密码为: *admin:adminpw*

运行如下命令进行CA服务器初始化：
```
# 初始化Root CA服务器
fabric-ca-server init -b admin:adminpw --home ./ca-server

# 初始化TLS CA服务器
fabric-ca-server init -b admin:adminpw --home ./tls-ca-server
```

初始化成功后，将在根目录下生成必要的一些文件，其中最重要是CA服务的配置文件：fabric-ca-server-config.yaml, 其目录结构如所示：
```
IssuerPublicKey  IssuerRevocationPublicKey  ca-cert.pem  fabric-ca-server-config.yaml  fabric-ca-server.db  msp
```

## 2. 启动CA服务器（不启用TLS）
**命令格式**：*fabric-ca-server start -b [username]:[passwd] --home [root_dir]* --cfg.affiliations.allowremove  --cfg.identities.allowremove
- [-b] 指定boostrap用户名和密码，该设定会自动写到CA的配置文件中
- [--home]制定CA服务器根目录
- [--cfg.affiliations.allowremove] 允许删除affiliation
- [--cfg.identities.allowremove] 允许删除identity

Step 1 中生成的CA服务器配置文件，默认是不启用TLS的，而且Step 1中的命令已经指定了bootstrap用户名和密码，所以如果没有其他的配置需要修改，直接运行如下命令启动CA服务器：
```
# 启动Root CA服务器
fabric-ca-server start --home ./ca-server

# 启动TLS CA服务器
fabric-ca-server start --home ./tls-ca-server
```

## 3. 启动ca client, 为两个服务器交叉生成各自的TLS证书
### 3.1 向TLS CA Server登记Root CA服务器的bootsrap用户的tls，生成Root CA服务器的tls通信证书
```
fabric-ca-client enroll -M ./crypto-config/rootca.baas.huobi.cn/tlsMSP -u http://tlsca.baas.huobi.cn:ht2020@tlsca.baas.huobi.cn:9526 --home ./ca-client --csr.hosts=['rootca.baas.huobi.cn']


fabric-ca-client enroll -d --enrollment.profile tls -u http://tlsca.baas.huobi.cn:ht2020@tlsca.baas.huobi.cn:9526 --home ./ca-client/ --csr.hosts=['rootca.baas.huobi.cn'] --csr.cn=rootca.baas.huobi.cn -M ./crypto-config/rootca.baas.huobi.cn/tls

cp ./crypto-config/rootca.baas.huobi.cn/tls/signercert/cert.pem server.crt
cp ./crypto-config/rootca.baas.huobi.cn/tls/keystore/*_sk server.key
cp ./crypto-config/rootca.baas.huobi.cn/tls/tlscacerts/*.pem ca.crt
```
> **特别提醒** -> 拷贝key文件到目标服务器msp目录下的keystore目录
```
cp ./crypto-config/rootca.baas.huobi.cn/tls/keystore/*_sk  [root ca服务器msp目录下的keystore]
```

### 3.2 向root ca server登记tls ca服务器的bootstrap用户的tls，生成tls ca服务器的tls通信证书
```
fabric-ca-client enroll -M ./crypto-config/tlsca.baas.huobi.cn/tlsMSP -u http://rootca.baas.huobi.cn:ht2020@rootca.baas.huobi.cn:9527 --home ./ca-client --csr.hosts=['tlsca.baas.huobi.cn']

fabric-ca-client affiliation list -M ./crypto-config/tlsca.baas.huobi.cn/tls -u http://rootca.baas.huobi.cn:ht2020@localhost:9527 --home ./ca-client


fabric-ca-client enroll -d --enrollment.profile tls -u http://tlsca.baas.huobi.cn:ht2020@rootca.baas.huobi.cn:9527 --home ./ca-client/ --csr.hosts=['tlsca.baas.huobi.cn'] --csr.cn=tlsca.baas.huobi.cn -M ./crypto-config/tlsca.baas.huobi.cn/tls

cp ./crypto-config/tlsca.baas.huobi.cn/tls/signercert/cert.pem server.crt
cp ./crypto-config/tlsca.baas.huobi.cn/tls/keystore/*_sk server.key
cp ./crypto-config/tlsca.baas.huobi.cn/tls/tlscacerts/*.pem ca.crt
```

> **特别提醒** -> 拷贝key文件到目标服务器msp目录下的keystore目录
```
cp ./crypto-config/tlsca.baas.huobi.cn/tls/keystore/*_sk  [tls ca服务器msp目录下的keystore]
```

## 为CA服务器启用TLS
修改CA服务器的配置文件*fabric-ca-server-config.yaml*
### tls ca服务器启用tls双向验证
![截屏2020-03-12下午6.39.23.png](http://note.youdao.com/yws/res/2176/WEBRESOURCEafb354c381e2fdb169053a4881e1263a)
### root ca服务器启用tls单向认证
![截屏2020-03-12下午6.42.32.png](http://note.youdao.com/yws/res/2177/WEBRESOURCEe5094513d2908fa35dc7dc227f486ac5)

### Docker启用TLS
```yaml
ca-root:
    container_name: ca-root
    image: hyperledger/fabric-ca:1.4.4
    environment:
      - FABRIC_CA_SERVER_HOME=/etc/hyperledger/fabric-ca-server
      - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_CSR_CN=*****
      - FABRIC_CA_SERVER_CSR_HOSTS=0.0.0.0
      - FABRIC_CA_SERVER_DEBUG=true
      - FABRIC_CA_SERVER_PORT=9527
    command: sh -c "fabric-ca-server start -b ******:***** --cfg.affiliations.allowremove --cfg.identities.allowremove"
    volumes:
      - ./ca-root:/etc/hyperledger/fabric-ca-server
    networks:
      - fabric-ca
    ports:
      - "9527:9527"
```      
> *替换成实际的内容


## Commands

openssl verify -verbose -CAfile ca.crt server.crt

openssl x509 -noout -text -in signcerts/cert.pem

fabric-ca-client enroll -d -M ./crypto-config/ca/users/ca.root/msp -u https://admin:adminpw@ca.root:9527  --home ./ --tls.certfiles tlscert/ca.root/server.crt --csr.cn=ca.root
