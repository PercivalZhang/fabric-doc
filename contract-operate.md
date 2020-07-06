docker exec -it cli bash

export CHANNEL_NAME=mychannel
export CONTRACT_NAME=demo

# 当前节点peer0.org1.example.com:7051
peer chaincode install -n ${CONTRACT_NAME} -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo/

# peer1.org1.example.com:8051
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp CORE_PEER_ADDRESS=peer1.org1.example.com:8051 CORE_PEER_LOCALMSPID="Org1MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt peer chaincode install -n $CONTRACT_NAME -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo


# peer0.org2.example.com:9051
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer0.org2.example.com:9051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt peer chaincode install -n $CONTRACT_NAME -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo

# peer1.org2.example.com:10051
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp CORE_PEER_ADDRESS=peer1.org2.example.com:10051 CORE_PEER_LOCALMSPID="Org2MSP" CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt peer chaincode install -n $CONTRACT_NAME -v 1.0 -l node -p /opt/gopath/src/github.com/chaincode/demo

# chaincode实例化
peer chaincode instantiate -o orderer.example.com:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt -C $CHANNEL_NAME -n $CONTRACT_NAME -l node -v 1.0 -c '{"Args":[]}' -P "AND('Org1MSP.member','Org2MSP.member')"

# 调用链码 - 写入操作
> 调用合约的add方法，向链上写入一个状态
peer chaincode invoke -o orderer.example.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/example.com/orderers/orderer.example.com/tls/ca.crt --peerAddresses peer0.org1.example.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt --peerAddresses peer1.org2.example.com:10051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.example.com/peers/peer1.org2.example.com/tls/ca.crt -C $CHANNEL_NAME -n $CONTRACT_NAME -c '{"Args":["add","dffdgh"]}'

# 查询链码
peer chaincode query -C $CHANNEL_NAME -n $CONTRACT_NAME -c '{"Args":["query","e31729f5bfb1e5eb656343a12c35ad7461ae7e1f14d0c51fa8f923908600f824"]}'
