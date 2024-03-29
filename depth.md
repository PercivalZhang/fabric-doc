# Depth合约分析和资产统计

挖矿逻辑比较特别，主要是中间结合了借贷平台，以Channel平台的借贷池子为例：

以HUSD为例，具体流程为：

• 用户可将HUSD存入Depth，我们将把HUSD转换为Channels借贷协议的cHUSD，这样用户就获得了Channels的存币收益，收益来源自Channels借贷协议的贷款利息。当然，用户也可以选择直接存入cHUSD(生息代币)。

• 由于Channels协议有存币挖矿的流动性奖励，用户在Depth存入的HUSD将会转存到Channels协议中，所以用户可以收取到Channels借贷协议存币挖矿的奖励CAN token所兑换而得到的HUSD/USDT奖励。奖励将自动从Channels提取并注入到对应的池子中，按比例分配给流动性提供者。

• 用户将HUSD或fHUSD存入Depth（即向Depth提供流动性），可以获得流动性池的交易手续费收益，这部分依赖交易量而变化。

整个过程可以参考下图：
![depth.png](https://github.com/PercivalZhang/fabric-doc/blob/master/resource/depth.png)

## 1.1 Mining Pool

https://depth.fi/mining



### 1.1.1 Depth专属借贷平台LP
- Channel
- Filda
- Lendhub

### 1.1.2 其他通用DEX LP

- MDEX (目前已经关闭)

## 1.2 关键合约

## 1.2.1 MasterChef合约

master chef合约负责pool的管理以及reward分配。

## 1.2.2 Channel池子相关合约

- **Liquidity pool token合约** - 0x8b65b86dc3cadca97b50d4757bb8a686e6ea0ce1
- **Swap合约** - 0x1D1cF3b43bC54B7D8e0F763B6b8957F480367834
- 存款凭证token合约
> 合约地址由swap合约的coins(index)获取
- 资产token合约
> 合约地址由swap合约的underlying_coins(index)获取
## 1.2.3 Filda池子相关合约

- **Liquidity pool token合约** - 0xb10b752b6ff723ffb25824f381517dc492f69d7e
- **Swap合约** - 0x7b04182d8e907f1c01f14e070eca75f6445a12e1
- 存款凭证token合约
> 合约地址由swap合约的coins(index)获取
- 资产token合约
> 合约地址由swap合约的underlying_coins(index)获取

## 1.2.3 Lendhub池子相关合约

- **Liquidity pool token** - 0x60FfCeb51D7640A3BdB996Aa2A8b770ca425fd60
- **Swap合约** - 0x07c8689ffc95caf92da7cc2a55bcbe7dafcf0a47
- 存款凭证token合约
> 合约地址由swap合约的coins(index)获取
- 资产token合约
> 合约地址由swap合约的underlying_coins(index)获取


## 1.3 资产分析逻辑

### 1.3.1 调用master chef合约poolInfo方法进行pool的遍历

- poolInfo(_pid) pool信息中包含
  * lpToken : lp token的合约地址
  * allocPoint ; reward份额占比
  * totalDeposit : 池子总质押lp token数量
- pendingPiggy(_pid, _user) 用户可领取奖励token数量
- userInfo(_pid, _user) 获取用户质押token信息
  * amount 用户质押凭证token数量

### 1.3.2 对pool信息进行分析

#### 1.3.2.1 通过lp token的合约的symbol方法返回的symbol来区分池子类型
比如章节1.1.1中的Depth专属借贷LP
- DEP+cHUSD+cUSDT
- DEP+fHUSD+fUSDT
- DEP+lHUSD+lUSDT
> DEP表明是专属LP，c开头代表channel，其他以及类推

剩下的其他就是MDEX上的LP

调用lp token合约的totalSupply()方法获取lp token总的数量；

#### 1.3.2.2. 根据第一步中识别的池子类型，分别调用对应的swap合约进行资产分析

每个lp token包含两个凭证token(比如cHUSD/cUSDT)以及对应的资产token(HUSD/USDT)，这些token地址可以通过swap合约的如下发放获取：

- coins(index: int) 获取凭证token的地址
- underlying_coins(index: int) 获取资产token的地址

获取Depth专属LP中凭证token的数量(比如cHUSD/cUSDT)
- balances(index: int)

获取lp token的价格, decimals=18
- get_virtual_price()
> 用于计算池子总价值，总质押价值，用户质押价值等

如何获取用户质押资产token的数量(HUSD/USDT) ?

master chef合约获取用户质押lp token的数量：myStakedLPBalance

lp token合约获取lp token总的数量：totalLPTAmount

用户资产在lp池子中的占比
```
myRatioInPool = myStakedLPBalance / totalLPTAmount；
```

swap合约的balances(index)获取lp token中的两个专属凭证token的数量：
- balances(0) ：dcToken0Amount (比如cHUSD)
- balances(1) : dcToken1Amount (比如cUSDT）

用户质押在lp池子中的两种凭证token(比如cHUSD/cUSDT)的数量
```
myDCToken0Amount = dcToken0Amount * myRatioInPool
myDCToken1Amount = dcToken1Amount * myRatioInPool
```

用户存入的是HUSD和USDT，如何知道他们的数量而不是凭证token（cHUSD/cUSDT)的数量呢？

凭证token(比如cHUSD)跟其对应的资产token(比如HUSD)不是一比一的转换关系，可以通过凭证token合约的exchangeRateStore()方法获取，注意该值decimals是18.

通过如下公式获取凭证token对应资产token数量：
```
myToken0Amount = myDCToken0Amount * exchangeRateStore0
myToken1Amount = myDCToken1Amount * exchangeRateStore1
```
> 注意该公式中myDCToken0Amount数值不要做凭证token的decimals转换

## 1.4 池子APY计算逻辑

标准的master chef pool 年华计算，不做阐述。

## 1.5 所有合约地址信息
```
"Depth": {
    "master.chef": {
      "address": "0x59f8ad2495236b25ba95e3161154f0024fbdbdce",
      "abi": "master.chef.json"
    },
    "pool": {
      "channel": {
        "lpt": {
          "address": "0x8b65b86dc3cadca97b50d4757bb8a686e6ea0ce1",
          "abi": "lp.token.dc.json"
        },
        "swap": {
          "address": "0x1D1cF3b43bC54B7D8e0F763B6b8957F480367834",
          "abi": "swap.token.dc.json"
        }
      },
      "filda": {
        "lpt": {
          "address": "0xb10b752b6ff723ffb25824f381517dc492f69d7e",
          "abi": "lp.token.dc.json"
        },
        "swap": {
          "address": "0x7b04182d8e907f1c01f14e070eca75f6445a12e1",
          "abi": "swap.token.dc.json"
        }
      },
      "lendhub": {
        "lpt": {
          "address": "0x60FfCeb51D7640A3BdB996Aa2A8b770ca425fd60",
          "abi": "lp.token.dc.json"
        },
        "swap": {
          "address": "0x07c8689ffc95caf92da7cc2a55bcbe7dafcf0a47",
          "abi": "swap.token.dc.json"
        }
      }
    }
  }
```

# 1.6 获取目标借贷池子的用户资产收据的示例代码
```
private async getDebitAndCreditLPTPoolReceipt (
        pool: Pool,
        address: string,
        annualRewardTokenAmount: BigNumber,
        priceReward: BigNumber,
        totalAlloc: BigNumber
    ): Promise<BankReceipt> {
        let receipt: BankReceipt = null;

        const userInfo = await this.masterChefContract.methods.userInfo(pool.pid, address).call();
        const pendingReward = await this.masterChefContract.methods.pendingPiggy(pool.pid, address).call();

        const myBalance = new BigNumber(userInfo['amount']);

        if (myBalance.gt(0)) {
            logger.debug(`getDebitAndCreditLPTPoolReceipt > my balance: ${myBalance.dividedBy(1e18).toNumber().toFixed(8)}`);
            receipt = {
                assets: [],
                balance: 0,
                miningAPY: '',
                rType: undefined,
                ratio: '',
                reward: undefined,
            };
            receipt.reward = {
                balance: Number.parseFloat(
                    new BigNumber(pendingReward).dividedBy(Math.pow(10, this.rewardToken.decimals)).toNumber().toFixed(8),
                ),
                symbol: this.rewardToken.symbol,
            };
            receipt.balance = Number.parseFloat(
                myBalance.dividedBy(Math.pow(10, 18)).toNumber().toFixed(8),
            );
            const myPoolRatio = myBalance.dividedBy(pool.totalDeposit);
            logger.debug(`getDebitAndCreditLPTPoolReceipt > my ratio in pool: ${myPoolRatio.toNumber().toFixed(8)}`);
            receipt.ratio = myPoolRatio.toNumber().toFixed(8);

            const totalLPTokens = new BigNumber(await pool.lpt.methods.totalSupply().call());

            const stakedRatio = pool.totalDeposit.dividedBy(totalLPTokens);
            logger.debug(`getDebitAndCreditLPTPoolReceipt > total staked LP ratio: ${stakedRatio.toNumber().toFixed(8)}`);

            const myLPRatio = myBalance.dividedBy(totalLPTokens);
            logger.debug(`getDebitAndCreditLPTPoolReceipt > my ratio in LP: ${myLPRatio.toNumber().toFixed(8)}`);

            const poolTokenData = this.poolTokenMap.get(pool.pid);
            
            const token0 = poolTokenData.token0;
            const token1 = poolTokenData.token1;
            const underlyingToken0 = poolTokenData.underlyingToken0;
            const underlyingToken1 = poolTokenData.underlyingToken1;

            logger.debug(`getDebitAndCreditLPTPoolReceipt > load dc token 0 contract - ${token0.address}`);
            const dcToken0Contract = await this.loadContract(token0.address, true, 'token.dc.json');

            logger.debug(`getDebitAndCreditLPTPoolReceipt > load dc token 1 contract - ${token1.address}`);
            const dcToken1Contract = await this.loadContract(token1.address, true, 'token.dc.json');

            const asset0 = new BigNumber(await pool.swap.methods.balances(0).call());
            logger.debug(
                `getCompoundLPPoolReceipt > asset[0] - ${token0.symbol} balance: ${asset0.dividedBy(
                    Math.pow(10, token0.decimals),
                ).toNumber().toFixed(4)}`,
            );

            const asset1 = new BigNumber(await pool.swap.methods.balances(1).call());
            logger.debug(
                `getCompoundLPPoolReceipt > asset[1] - ${token1.symbol} balance: ${asset1.dividedBy(Math.pow(10, token1.decimals)).toNumber().toFixed(4)}`,
            );

            // 在计算underlying token数量的时候，token0的数量一定是原始数值，而不是与其decimals进行换算后的值
            // 切记！！！！！
            const exchangeRate0 = new BigNumber(await dcToken0Contract.methods.exchangeRateCurrent().call());
            logger.debug(`getDebitAndCreditLPTPoolReceipt > ${token0['symbol']} exchange rate: ${exchangeRate0}`);
            const underlyingAsset0 = asset0.multipliedBy(exchangeRate0).dividedBy(Math.pow(10, 18)).dividedBy(
                Math.pow(10, underlyingToken0.decimals),
            );
            logger.debug(
                `underlying asset[0] - ${underlyingToken0.symbol} balance: ${underlyingAsset0
                    .toNumber()
                    .toFixed(4)}`,
            );

            const exchangeRate1 = new BigNumber(await dcToken1Contract.methods.exchangeRateCurrent().call());
            logger.debug(`getDebitAndCreditLPTPoolReceipt > ${token1['symbol']} exchange rate: ${exchangeRate1}`);
            const underlyingAsset1 = asset1.multipliedBy(exchangeRate1).dividedBy(Math.pow(10, 18)).dividedBy(
                Math.pow(10, underlyingToken1.decimals),
            );;
            logger.debug(
                `underlying asset[1] - ${underlyingToken1['symbol']} balance: ${underlyingAsset1
                    .toNumber()
                    .toFixed(4)}`,
            );

            const miningRewardValue = annualRewardTokenAmount
                .multipliedBy(pool.allocPoint)
                .multipliedBy(priceReward)
                .dividedBy(totalAlloc);
            logger.debug(
                `getLPPoolReceipt > pool yearly mining reward value: ${miningRewardValue.toNumber().toFixed(4)} ${StableCoin.symbol}`,
            );

            const priceVirtualLPT = new BigNumber(await pool.swap.methods.get_virtual_price().call()).dividedBy(1e18);
            const totalPoolValue = priceVirtualLPT.multipliedBy(totalLPTokens).dividedBy(1e18);
            
            logger.warn(`getDebitAndCreditLPTPoolReceipt > total pool value: ${totalPoolValue.toNumber().toFixed(4)} ${StableCoin.symbol}`);

            const APY = miningRewardValue.multipliedBy(stakedRatio).dividedBy(totalPoolValue);
            logger.debug(`APY: ${APY.toNumber().toFixed(4)}`);
            receipt.miningAPY = APY.toNumber().toFixed(4);

            const myUnderlyingAsset0 = underlyingAsset0.multipliedBy(myLPRatio);
            logger.debug(
                `getDebitAndCreditLPTPoolReceipt > my underlying asset[0] - ${
                    underlyingToken0.symbol
                } balance: ${myUnderlyingAsset0}`,
            );
            receipt.assets.push({
                balance: Number.parseFloat(myUnderlyingAsset0.toString()),
                symbol: underlyingToken0['symbol'],
            });

            const myUnderlyingAsset1 = underlyingAsset1.multipliedBy(myLPRatio);
            logger.debug(
                `getDebitAndCreditLPTPoolReceipt > my underlying asset[1] - ${
                    underlyingToken1['symbol']
                } balance: ${myUnderlyingAsset1}`,
            );
            receipt.assets.push({
                balance: Number.parseFloat(myUnderlyingAsset1.toString()),
                symbol: underlyingToken1['symbol'],
            });
        }
        return receipt;
    }
```
