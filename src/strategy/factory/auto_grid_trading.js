const SubscribeFactory = require("jcc_rpc").SubscribeFactory;
const subscribeInst = SubscribeFactory.init();
subscribeInst.setMaxListeners(100);
const BigNumber = require("bignumber.js");
const GridTradingFactory = require("./grid_trading");

const AutoGridTradingFactory = (Exchange, profit, timer) => {
  const gridTrading = GridTradingFactory(Exchange);
  const { sellProfit, buyProfit } = profit;

  subscribeInst.on("watchOrder", async (id) => {
    try {
      console.log("开始获取订单状态：", id);
      const orderInfo = await Exchange.fetchOrder(id);
      if (orderInfo) {
        const { side, filled, symbol, status } = orderInfo;
        const orderPrice = orderInfo.price;
        // 部分成交或完全成交，成交数量大于0
        if ((status === "partial-filled" || status === "filled" || status === "closed") && filled > 0) {
          console.log(`${symbol}${side === "buy" ? "买单" : "卖单"}, 价格: ${orderPrice}, 数量: ${filled}, 已成交`);
          if (side === "buy") {
            const price = new BigNumber(orderPrice).multipliedBy(new BigNumber(1).plus(sellProfit)).toString();
            console.log(`开始挂卖单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
            const res = await Exchange.createOrder(symbol, "limit", "sell", filled, price);
            console.log("挂单成功：", res.id);
            subscribeInst.emit("watchOrder", res.id);
          } else if (side === "sell") {
            const price = new BigNumber(orderPrice).multipliedBy(new BigNumber(1).minus(buyProfit)).toString();
            console.log(`开始挂买单, 交易对: ${symbol}, 数量: ${filled}, 价格: ${price}`);
            const res = await Exchange.createOrder(symbol, "limit", "buy", filled, price);
            console.log("挂单成功：", res.id);
            subscribeInst.emit("watchOrder", res.id);
          }
        } else if (status === "open") {
          setTimeout(() => {
            subscribeInst.emit("watchOrder", id);
          }, timer);
        }
      }
    } catch (error) {
      setTimeout(() => {
        subscribeInst.emit("watchOrder", id);
      }, timer);
    }
  });

  const startTrading = async ({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type }) => {
    try {
      const orders = await gridTrading.startTrading({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type });
      for (const order of orders) {
        subscribeInst.emit("watchOrder", order.id);
      }
    } catch (error) {}
  };

  return {
    startTrading
  };
};

module.exports = AutoGridTradingFactory;
