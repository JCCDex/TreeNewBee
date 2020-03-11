const sleep = require("sleep");
const ccxt = require("../../ccxt");
const config = require("./config");
const SubscribeFactory = require("jcc_rpc").SubscribeFactory;
const subscribeInst = SubscribeFactory.init();
subscribeInst.setMaxListeners(100);

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

let amount = Math.floor(Math.random() * 10 + 30);
let stepIndex = 10; //深度排序

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

// 监听火币订单事件
subscribeInst.on("huobiOrder", async (order) => {
  try {
    sleep.sleep(10);
    const orderInfo = await huobipro.fetchOrder(order.id);
    if (orderInfo) {
      const { side, filled, symbol, status } = orderInfo;
      const orderPrice = orderInfo.price;
      // 部分成交或完全成交，成交数量大于0
      if ((status === "partial-filled" || status === "filled" || status === "closed") && filled > 0) {
        console.log("已成交");
        if (side === "buy") {
          const price = orderPrice * (1 + config.profit);
          console.log(`开始挂火币卖单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
          const res = await huobipro.createOrder(symbol, "limit", "sell", filled, price);
          subscribeInst.emit("huobiOrder", res);
          try {
            console.log(`开始挂威链卖单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
            await weidex.createOrder(symbol, "sell", filled, price);
          } catch (error) {
            console.log("威链卖单失败:", error);
          }
        } else if (side === "sell") {
          const price = orderPrice * (1 - config.profit);
          console.log(`开始挂火币买单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
          const res = await huobipro.createOrder(symbol, "limit", "buy", filled, price);
          subscribeInst.emit("huobiOrder", res);
          try {
            console.log(`开始挂威链买单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
            await weidex.createOrder(symbol, "buy", filled, price);
          } catch (error) {
            console.log("威链买单失败:", error);
          }
        }
      } else if (status === "open") {
        subscribeInst.emit("huobiOrder", order);
      }
    }
  } catch (error) {
    subscribeInst.emit("huobiOrder", order);
  }
});

// 在火币上挂单，监听挂单状态，成交后立即在火币和威链上挂相反的单子，考虑到目前账号买或卖手续费为2‰，
// 成交后卖单价格上浮1%，买单价格下调1%
const startCreateOrder = async function() {
  let pairs = config.tradePairs;

  for (const pair of pairs) {
    try {
      //根据资金判断是买还是卖
      const orderBookAndBalance = await Promise.all([huobipro.fetchOrderBook(pair), huobipro.fetchBalance()]);
      const [orderBook, balance] = orderBookAndBalance;
      if (orderBook && balance) {
        let base = pair.split("/")[0];
        let counter = pair.split("/")[1];
        let balance_base = balance[base];
        let balance_counter = balance[counter];
        if (balance_base.free > 0 && balance_counter.free > 0) {
          let orderInfo;
          const bidPrice = getBidPrice(orderBook, stepIndex);
          const askPrice = getAskPrice(orderBook, stepIndex);
          if (bidPrice && askPrice) {
            if (bidPrice && balance_base.free * bidPrice < balance_counter.free) {
              console.log(`开始挂火币买单, 交易对: ${pair}, 数量: ${amount}, 价格: ${bidPrice}`);
              orderInfo = await huobipro.createOrder(pair, "limit", "buy", amount, bidPrice);
            } else {
              console.log(`开始挂火币卖单, 交易对: ${pair}, 数量: ${amount}, 价格: ${askPrice}`);
              orderInfo = await huobipro.createOrder(pair, "limit", "sell", amount, askPrice);
            }
            subscribeInst.emit("huobiOrder", orderInfo);
          }
        }
      }
    } catch (error) {
      console.log("huobiweidex error: ", error);
    }
  }
};

const cancelAllOrders = async () => {
  let pairs = config.tradePairs;
  for (const pair of pairs) {
    const orders = await Promise.all([huobipro.fetchOpenOrders(pair), weidex.fetchOrders(pair)]);
    const [huobiOrders, weidexOrders] = orders;
    console.log("当前火币挂单:", huobiOrders);
    console.log("当前威链挂单:", weidexOrders);
    const orderProps = [];
    for (const huobiOrder of huobiOrders) {
      orderProps.push(huobipro.cancelOrder(huobiOrder.id));
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
