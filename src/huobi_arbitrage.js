"use strict";
const BigNumber = require("bignumber.js");
const ccxt = require("./ccxt");
const config = require("./config");
const pairs = config.tradePairs;
const profit = config.profit;
const amountLimit = config.amountLimit;

const weidex = new ccxt["weidex"]({
  address: config.jingtumHuobi.address,
  secret: config.jingtumHuobi.secret,
  enableRateLimit: true
});

const huobipro = new ccxt["huobipro"]({
  apiKey: config.huobi.access_key,
  secret: config.huobi.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  urls: {
    api: {
      market: config.huobi.market,
      public: config.huobi.public,
      private: config.huobi.private,
      zendesk: config.huobi.zendesk
    }
  },
  hostname: config.huobi.hostname
});

const run = () => {
  for (const pair of pairs) {
    startCheck(pair);
  }
};

// bids买单，asks卖单
const startCheck = async (pair) => {
  try {
    const markets = await Promise.all([huobipro.fetchOrderBook(pair), weidex.fetchOrderBook(pair)]);
    const [huobiMarkets, weidexMarkets] = markets;

    // 火币最高价买一单
    const maxHuobiBid = huobiMarkets.bids[0];
    // 火币最低价买一单
    const minHuobiAsk = huobiMarkets.asks[0];
    // 威链最高价买一单
    const maxWeidexBid = weidexMarkets.bids[0];
    // 威链最低价卖一单
    const minWeidexAsk = weidexMarkets.asks[0];

    console.log(`${pair}火币最高价买单：`, maxHuobiBid);
    console.log(`${pair}火币最低价卖单：`, minHuobiAsk);
    console.log(`${pair}威链最高价买单：`, maxWeidexBid);
    console.log(`${pair}威链最低价卖单：`, minWeidexAsk);

    const maxAmount = amountLimit[pair].maxAmount;
    // 威链买火币卖
    // 比较威链最低卖单和火币最高买单
    if (
      new BigNumber(maxHuobiBid[0])
        .div(minWeidexAsk[0])
        .minus(1)
        .isGreaterThanOrEqualTo(profit)
    ) {
      // 威链买火币卖
      console.log("威链买火币卖");
      const [weidexPrice, weidexAmount] = minWeidexAsk;
      const [huobiPrice, huobiAmount] = maxHuobiBid;
      let amount = weidexAmount > huobiAmount ? huobiAmount : weidexAmount;
      amount = amount > maxAmount ? maxAmount : amount;
      await huobipro.createOrder(pair, "limit", "sell", amount, huobiPrice);
      await weidex.createOrder(pair, "buy", amount, weidexPrice);
    }
    // 威链卖火币买
    // 比较威链最高买单和火币最低卖单
    else if (
      new BigNumber(maxWeidexBid[0])
        .div(minHuobiAsk[0])
        .minus(1)
        .isGreaterThanOrEqualTo(profit)
    ) {
      // 威链卖火币买
      console.log("威链卖火币买");
      const [weidexPrice, weidexAmount] = maxWeidexBid;
      const [huobiPrice, huobiAmount] = minHuobiAsk;
      let amount = weidexAmount > huobiAmount ? huobiAmount : weidexAmount;
      amount = amount > maxAmount ? maxAmount : amount;
      await huobipro.createOrder(pair, "limit", "buy", amount, huobiPrice);
      await weidex.createOrder(pair, "sell", amount, weidexPrice);
    }
  } catch (error) {
    console.log(error);
  }
};

run();
setInterval(run, 30000);
