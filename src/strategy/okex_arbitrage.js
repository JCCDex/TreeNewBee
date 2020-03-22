"use strict";
const BigNumber = require("bignumber.js");
const ccxt = require("../ccxt");
const config = require("./config");
const pairs = config.tradePairs;
const profit = config.arbitrageProfit;

const weidex = new ccxt["weidex"]({
  address: config.jingtumArbitrage.address,
  secret: config.jingtumArbitrage.secret,
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

    console.log(`okex ${base}可用余额: `, okex_base_free);
    console.log(`okex ${counter}可用余额: `, okex_counter_free);
    console.log(`威链 ${base}可用余额: `, weidex_base_free);
    console.log(`威链 ${counter}可用余额: `, weidex_counter_free);

    const markets = await Promise.all([okex3.fetchOrderBook(pair), weidex.fetchOrderBook(pair)]);
    const [okexMarkets, weidexMarkets] = markets;

    // okex最高价买一单
    const maxOkexBid = okexMarkets.bids[0];
    // okex最低价买一单
    const minOkexAsk = okexMarkets.asks[0];

    console.log(`${pair} okex最高价买单：`, maxOkexBid);
    console.log(`${pair} okex最低价卖单：`, minOkexAsk);

    const matchWeidexAsks = weidexMarkets.asks.filter((ask) => {
      return new BigNumber(maxOkexBid[0])
        .div(ask[0])
        .minus(1)
        .isGreaterThanOrEqualTo(profit);
    });

    const matchWeidexBids = weidexMarkets.bids.filter((bid) => {
      return new BigNumber(bid[0])
        .div(minOkexAsk[0])
        .minus(1)
        .isGreaterThanOrEqualTo(profit);
    });

    console.log("matchWeidexAsks: ", matchWeidexAsks);
    console.log("matchWeidexBids: ", matchWeidexBids);

    // 威链买okex卖
    // 比较威链最低卖单和okex最高买单
    if (matchWeidexAsks.length > 0) {
      // 威链买okex卖
      // 以XRP/USDT为例
      // 威链上用usdt买xrp, okex上卖xrp
      console.log("威链买okex卖");
      const weidexPrice = matchWeidexAsks[matchWeidexAsks.length - 1][0];
      const weidexAmount = matchWeidexAsks.map((ask) => ask[1]).reduce((total, amount) => new BigNumber(total).plus(amount).toNumber());
      console.log("weidex price:", weidexPrice);
      console.log("weidex match total amount:", weidexAmount);
      const [okexPrice, okexAmount] = maxOkexBid;
      let amount = weidexAmount > okexAmount ? okexAmount : weidexAmount;
      amount = new BigNumber(amount).gt(okex_base_free) ? okex_base_free : amount;

      if (new BigNumber(amount).multipliedBy(weidexPrice).gt(weidex_counter_free)) {
        console.log(`威链${counter}余额不足`);
        return;
      }

      if (new BigNumber(amount).multipliedBy(okexPrice).lt(costMin)) {
        console.log(`不符合Okex最小挂单额`);
        return;
      }

      await okex3.createOrder(pair, "limit", "sell", amount, okexPrice);
      await weidex.createOrder(pair, "buy", amount, new BigNumber(weidexPrice).multipliedBy(1.001).toNumber());
    }
    // 威链卖okex买
    // 比较威链最高买单和okex最低卖单
    else if (matchWeidexBids.length > 0) {
      // 威链卖okex买
      // 以XRP/USDT为例
      // okex上用usdt买xrp, 威链上卖xrp
      console.log("威链卖okex买");
      const weidexPrice = matchWeidexBids[matchWeidexBids.length - 1][0];
      const weidexAmount = matchWeidexBids.map((bid) => bid[1]).reduce((total, amount) => new BigNumber(total).plus(amount).toNumber());
      console.log("weidex price:", weidexPrice);
      console.log("weidex match total amount:", weidexAmount);
      const [okexPrice, okexAmount] = minOkexAsk;
      let amount = weidexAmount > okexAmount ? okexAmount : weidexAmount;
      amount = new BigNumber(amount).gt(weidex_base_free) ? weidex_base_free : amount;

      if (new BigNumber(amount).multipliedBy(okexPrice).gt(okex_counter_free)) {
        console.log(`Okex ${counter}余额不足`);
        return;
      }
      if (new BigNumber(amount).multipliedBy(okexPrice).lt(costMin)) {
        console.log(`不符合Okex最小挂单额`);
        return;
      }
      await okex3.createOrder(pair, "limit", "buy", amount, okexPrice);
      await weidex.createOrder(pair, "sell", amount, new BigNumber(weidexPrice).multipliedBy(0.999).toNumber());
    }
  } catch (error) {
    console.log(error);
  }
};

run();
setInterval(run, 30000);
