<!-- markdownlint-disable MD029 -->

# TreeNewBee

这是个吹牛逼的项目,anyway，就是这个意思

谨以此项目名称纪念各种对我们吹牛逼但是没有实现的团队和个人，不仅限于搬砖。非要逼我们自己来做，ok，let's do it.

## 使用说明和步骤

1. 准备工作

```shell
1. git clone https://github.com/JCCDex/TreeNewBee.git

2. cd src

3. npm i

4. cd strategy

5. config.js填写相关配置

```

2. 在 huobi 和 weidex 之间搬砖

```shell
// 执行周期: 30s, 默认状态
node huobi_arbitrage.js

// 执行周期: 60s
node huobi_arbitrage.js -p 60
```

3. 在 okex 和 weidex 之间搬砖

```shell
// 执行周期: 30s, 默认状态
node okex_arbitrage.js

// 执行周期: 60s
node okex_arbitrage.js -p 60
```

4. 网格交易

```shell
# 以xrp/usdt为例

# 交易对
pair="xrp/usdt"
# 数量上限
amountCeiling=100
# 数量下限
amountFloor=10
# 价格上限
priceCeiling=0.15
# 价格下限
priceFloor=0.1
# 挂单数量
tradingQuantity=10
# 买单
type="buy"
# 卖单
# type="sell"

# huobi
node huobi_grid_trading.js -p $pair -H $amountCeiling -L $amountFloor -h $priceCeiling -l $priceFloor -q $tradingQuantity -t $type

# okex
node okex_grid_trading.js -p $pair -H $amountCeiling -L $amountFloor -h $priceCeiling -l $priceFloor -q $tradingQuantity -t $type

```
