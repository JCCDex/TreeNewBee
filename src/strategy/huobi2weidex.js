const ccxt = require("ccxt");
const Weidex = require("../js/weidex");
const config = require("./config");
const amountLimit = config.amountLimit;

const weidex = new Weidex({
  address: config.jingtumHuobi.address,
  secret: config.jingtumHuobi.secret,
  enableRateLimit: true
});

const huobipro = new ccxt.huobipro({
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

const cancelWeidexOrders = async (pair) => {
  try {
    const orders = await weidex.fetchOpenOrders(pair);
    for (const order of orders) {
      try {
        const res = await weidex.cancelOrder(order.id, pair);
        console.log("取消成功: ", res);
      } catch (error) {
        console.log("取消失败: ", error);
      }
    }
  } catch (error) {
    console.log(error);
  }
};

// 火币订单映射到威链上
const startMapping = () => {
  const pairs = config.tradePairs;
  for (const pair of pairs) {
    mappingPair(pair);
  }
};

const mappingPair = async (pair) => {
  await cancelWeidexOrders(pair);
  const order = await huobipro.fetchOrderBook(pair);
  const { bids, asks } = order;

  const maxAmount = amountLimit[pair].maxAmount;
  // 映射买单
  // 等比例缩小100倍，如超过最大数量限制，映射限制的数量
  for (const bid of bids) {
    const [price, amount] = bid;
    try {
      const res = await weidex.createOrder(pair, "limit", "buy", amount / 100 > maxAmount ? maxAmount : amount / 100, price);
      console.log("映射成功：", res);
    } catch (error) {
      console.log("映射失败：", error);
    }
  }

  // 映射卖单
  // 等比例缩小100倍，如超过最大数量限制，映射限制的数量
  for (const ask of asks) {
    const [price, amount] = ask;
    try {
      const res = await weidex.createOrder(pair, "limit", "buy", amount / 100 > maxAmount ? maxAmount : amount / 100, price);
      console.log("映射成功：", res);
    } catch (error) {
      console.log("映射失败：", error);
    }
  }
};

startMapping();
// 60分钟映射一次
setInterval(startMapping, 60 * 60 * 1000);
