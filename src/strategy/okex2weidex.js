const ccxt = require("../ccxt");
const config = require("./config");
const amountLimit = config.amountLimit;

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

// okex订单映射到威链上
const startMapping = () => {
  let pairs = config.tradePairs;
  for (const pair of pairs) {
    mappingPair(pair);
  }
};

const mappingPair = async (pair) => {
  await cancelWeidexOrders(pair);
  const order = await okex3.fetchOrderBook(pair);
  const { bids, asks } = order;

  const maxAmount = amountLimit[pair].maxAmount;
  // 映射买单
  // 等比例缩小100倍，如超过最大数量限制，映射限制的数量
  for (const bid of bids) {
    const [price, amount] = bid;
    try {
      const res = await weidex.createOrder(pair, "buy", amount / 100 > maxAmount ? maxAmount : amount / 100, price);
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
      const res = await weidex.createOrder(pair, "sell", amount / 100 > maxAmount ? maxAmount : amount / 100, price);
      console.log("映射成功：", res);
    } catch (error) {
      console.log("映射失败：", error);
    }
  }
};

startMapping();
// 60分钟映射一次
setInterval(startMapping, 60 * 60 * 1000);
