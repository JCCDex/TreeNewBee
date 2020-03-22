<!-- markdownlint-disable MD029 -->

# TreeNewBee

这是个吹牛逼的项目,anyway，就是这个意思

谨以此项目名称纪念各种对我们吹牛逼但是没有实现的团队和个人，不仅限于搬砖。非要逼我们自己来做，ok，let's do it.

## 使用说明和步骤

1. 准备工作

```javascript
1. git clone https://github.com/JCCDex/TreeNewBee.git

2. cd src

3. npm i

4. cd strategy

5. config.js填写相关配置

```

2. 在 huobi 和 weidex 之间搬砖

```javascript
// 执行周期: 30s, 默认状态
node huobi_arbitrage.js

// 执行周期: 60s
node huobi_arbitrage.js -p 60
```

3. 在 okex 和 weidex 之间搬砖

```javascript
// 执行周期: 30s, 默认状态
node okex_arbitrage.js

// 执行周期: 60s
node okex_arbitrage.js -p 60
```
