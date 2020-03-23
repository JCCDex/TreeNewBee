const sleep = require("sleep");
const Okex3 = require("ccxt").okex3;
const Weidex = require("../js/weidex");
const config = require("./config");
const SubscribeFactory = require("jcc_rpc").SubscribeFactory;
const subscribeInst = SubscribeFactory.init();
subscribeInst.setMaxListeners(100);

const weidex = new Weidex({
  address: config.jingtumOkex.address,
  secret: config.jingtumOkex.secret,
  enableRateLimit: true
});

const okex3 = new Okex3({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

const amount = Math.floor(Math.random() * 10 + 30);
const stepIndex = 10; // 深度排序

const getBidPrice = (orderBook, index) => {
  let price = null;
  try {
    price = orderBook.bids[index][0];
  } catch (error) {}
  return price;
};

const getAskPrice = (orderBook, index) => {
  let price = null;
  try {
    price = orderBook.asks[index][0];
  } catch (error) {}
  return price;
};

// 监听okex订单事件
subscribeInst.on("okexOrder", async (order) => {
  try {
    sleep.sleep(3);
    const orderInfo = await okex3.fetchOrder(order.id, order.symbol);
    if (orderInfo) {
      const { side, filled, symbol, status } = orderInfo;
      const orderPrice = orderInfo.price;
      // 部分成交或完全成交，成交数量大于0
      if ((status === "partial-filled" || status === "filled" || status === "closed") && filled > 0) {
        console.log(`${symbol}${side === "buy" ? "买单" : "卖单"}, 价格: ${orderPrice}, 数量: ${filled}, 已成交`);
        if (side === "buy") {
          const price = orderPrice * (1 + config.gridProfit);
          console.log(`开始挂okex卖单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
          const res = await okex3.createOrder(symbol, "limit", "sell", filled, price);
          subscribeInst.emit("okexOrder", res);
          try {
            console.log(`开始挂威链卖单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
            await weidex.createOrder(symbol, "limit", "sell", filled, price);
          } catch (error) {
            console.log("威链卖单失败:", error);
          }
        } else if (side === "sell") {
          const price = orderPrice * (1 - config.gridProfit);
          console.log(`开始挂okex买单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
          const res = await okex3.createOrder(symbol, "limit", "buy", filled, price);
          subscribeInst.emit("okexOrder", res);
          try {
            console.log(`开始挂威链买单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
            await weidex.createOrder(symbol, "limit", "buy", filled, price);
          } catch (error) {
            console.log("威链买单失败:", error);
          }
        }
      } else if (status === "open") {
        subscribeInst.emit("okexOrder", order);
      }
    }
  } catch (error) {
    console.log(error);
    subscribeInst.emit("okexOrder", order);
  }
});

// 在okex上挂单，监听挂单状态，成交后立即在okex和威链上挂相反的单子，考虑到目前账号挂单手续费1‰，吃单手续费1.5‰，
// 成交后卖单价格上浮1%，买单价格下调1%
const startCreateOrder = async function() {
  const pairs = config.tradePairs;

  for (const pair of pairs) {
    try {
      // 根据资金判断是买还是卖
      const orderBookAndBalance = await Promise.all([okex3.fetchOrderBook(pair), okex3.fetchBalance()]);
      const [orderBook, balance] = orderBookAndBalance;
      if (orderBook && balance) {
        const base = pair.split("/")[0];
        const counter = pair.split("/")[1];
        const baseBalance = balance[base];
        const counterBalance = balance[counter];
        if (baseBalance.free > 0 && counterBalance.free > 0) {
          let orderInfo;
          const bidPrice = getBidPrice(orderBook, stepIndex);
          const askPrice = getAskPrice(orderBook, stepIndex);
          if (bidPrice && askPrice) {
            if (bidPrice && baseBalance.free * bidPrice < counterBalance.free) {
              console.log(`开始挂okex买单, 交易对: ${pair}, 数量: ${amount}, 价格: ${bidPrice}`);
              orderInfo = await okex3.createOrder(pair, "limit", "buy", amount, bidPrice);
            } else {
              console.log(`开始挂okex卖单, 交易对: ${pair}, 数量: ${amount}, 价格: ${askPrice}`);
              orderInfo = await okex3.createOrder(pair, "limit", "sell", amount, askPrice);
            }
            subscribeInst.emit("okexOrder", orderInfo);
          }
        }
      }
    } catch (error) {
      console.log("huobiweidex error: ", error);
    }
  }
};

const cancelAllOrders = async () => {
  const pairs = config.tradePairs;
  for (const pair of pairs) {
    const orders = await Promise.all([okex3.fetchOpenOrders(pair), weidex.fetchOrders(pair)]);
    const [okexOrders, weidexOrders] = orders;
    console.log("当前okex挂单:", okexOrders);
    console.log("当前威链挂单:", weidexOrders);
    const orderProps = [];
    for (const okexOrder of okexOrders) {
      orderProps.push(okex3.cancelOrder(okexOrder.id));
    }
    for (const weidexOrder of weidexOrders) {
      orderProps.push(weidex.cancelOrder(weidexOrder.id));
    }
    // 取消所有挂单
    await Promise.all(orderProps);
  }
};

startCreateOrder();
// 每隔5分钟开始挂单
setInterval(startCreateOrder, 5 * 60 * 1000);

// 每隔60分钟取消所有挂单
setInterval(cancelAllOrders, 60 * 60 * 1000);
