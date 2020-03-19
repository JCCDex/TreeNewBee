"use strict";
const BigNumber = require("bignumber.js");
const ccxt = require("./ccxt");
const config = require("./config");
const pairs = config.tradePairs;
const profit = config.arbitrageProfit;

const weidex = new ccxt["weidex"]({
  address: config.jingtumOkex.address,
  secret: config.jingtumOkex.secret,
  enableRateLimit: true
});

const okex3 = new ccxt["okex3"]({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

const run = () => {
  for (const pair of pairs) {
    startCheck(pair);
  }
};

// bids买单，asks卖单
const startCheck = async (pair) => {
  try {
    const marketsInfo = await okex3.loadMarkets();
    const costMin = marketsInfo[pair].limits.cost.min;
    console.log("cost min: ", costMin);

    const [okexBalance, weidexBalance] = await Promise.all([okex3.fetchBalance(), weidex.fetchBalance()]);
    const [base, counter] = pair.split("/");
    const okex_base_free = okexBalance[base].free;
    const okex_counter_free = okexBalance[counter].free;
    const weidex_base_free = weidexBalance[base].free;
    const weidex_counter_free = weidexBalance[counter].free;

    console.log(`okex${base}可用余额: `, okex_base_free);
    console.log(`okex${counter}可用余额: `, okex_counter_free);
    console.log(`威链${base}可用余额: `, weidex_base_free);
    console.log(`威链${counter}可用余额: `, weidex_counter_free);

    const markets = await Promise.all([okex3.fetchOrderBook(pair), weidex.fetchOrderBook(pair)]);
    const [huobiMarkets, weidexMarkets] = markets;

    // okex最高价买一单
    const maxHuobiBid = huobiMarkets.bids[0];
    // okex最低价买一单
    const minHuobiAsk = huobiMarkets.asks[0];
    // 威链最高价买一单
    const maxWeidexBid = weidexMarkets.bids[0];
    // 威链最低价卖一单
    const minWeidexAsk = weidexMarkets.asks[0];

    console.log(`${pair} okex最高价买单：`, maxHuobiBid);
    console.log(`${pair} okex最低价卖单：`, minHuobiAsk);
    console.log(`${pair} 威链最高价买单：`, maxWeidexBid);
    console.log(`${pair} 威链最低价卖单：`, minWeidexAsk);

    // 威链买okex卖
    // 比较威链最低卖单和okex最高买单
    if (
      new BigNumber(maxHuobiBid[0])
        .div(minWeidexAsk[0])
        .minus(1)
        .isGreaterThanOrEqualTo(profit)
    ) {
      // 威链买okex卖
      // 以XRP/USDT为例
      // 威链上用usdt买xrp, okex上卖xrp
      console.log("威链买okex卖");
      const [weidexPrice, weidexAmount] = minWeidexAsk;
      const [okexPrice, okexAmount] = maxHuobiBid;
      let amount = weidexAmount > okexAmount ? okexAmount : weidexAmount;
      amount = new BigNumber(amount).gt(okex_base_free) ? okex_base_free : amount;

      if (new BigNumber(amount).multipliedBy(weidexPrice).lt(weidex_counter_free)) {
        return;
      }

      if (new BigNumber(amount).multipliedBy(okexPrice).lt(costMin)) {
        return;
      }

      await okex3.createOrder(pair, "limit", "sell", amount, okexPrice);
      await weidex.createOrder(pair, "buy", amount, weidexPrice);
    }
    // 威链卖okex买
    // 比较威链最高买单和okex最低卖单
    else if (
      new BigNumber(maxWeidexBid[0])
        .div(minHuobiAsk[0])
        .minus(1)
        .isGreaterThanOrEqualTo(profit)
    ) {
      // 威链卖okex买
      // 以XRP/USDT为例
      // okex上用usdt买xrp, 威链上卖xrp
      console.log("威链卖okex买");
      const [weidexPrice, weidexAmount] = maxWeidexBid;
      const [okexPrice, okexAmount] = minHuobiAsk;
      let amount = weidexAmount > okexAmount ? okexAmount : weidexAmount;
      amount = new BigNumber(amount).gt(weidex_base_free) ? weidex_base_free : amount;

      if (new BigNumber(amount).multipliedBy(okexPrice).lt(okex_counter_free)) {
        return;
      }
      if (new BigNumber(amount).multipliedBy(okexPrice).lt(costMin)) {
        return;
      }
      await okex3.createOrder(pair, "limit", "buy", amount, okexPrice);
      await weidex.createOrder(pair, "sell", amount, weidexPrice);
    }
  } catch (error) {
    console.log(error);
  }
};

run();
setInterval(run, 30000);
