const BigNumber = require("bignumber.js");

const MappingFactory = (fromExchange, toExchange, { scaling, amountLimit, cancel }) => {
  const cancelMappingOrders = async (pair) => {
    try {
      const orders = await toExchange.fetchOpenOrders(pair);
      for (const order of orders) {
        try {
          const res = await toExchange.cancelOrder(order.id, pair);
          console.log("取消成功: ", res);
        } catch (error) {
          console.log("取消失败: ", error);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  const mapping = async (pair) => {
    if (cancel) {
      await cancelMappingOrders(pair);
    }

    const order = await fromExchange.fetchOrderBook(pair);
    const bids = order.bids.slice(0, 20);
    const asks = order.asks.slice(0, 20);

    // 映射买单
    // 等比例缩小scaling倍，如超过amountLimit，取amountLimit
    for (const bid of bids) {
      const [price, amount] = bid;
      try {
        const res = await toExchange.createOrder(pair, "limit", "buy", amount / scaling > amountLimit ? amountLimit : amount / scaling, price);
        console.log("映射成功：", res);
      } catch (error) {
        console.log("映射失败：", error);
      }
    }

    // 映射卖单
    // 等比例缩小scaling倍，如超过amountLimit，取amountLimit
    for (const ask of asks) {
      const [price, amount] = ask;
      try {
        const res = await toExchange.createOrder(pair, "limit", "sell", amount / scaling > amountLimit ? amountLimit : amount / scaling, price);
        console.log("映射成功：", res);
      } catch (error) {
        console.log("映射失败：", error);
      }
    }
  };

  const run = (pairs) => {
    for (const pair of pairs) {
      mapping(pair);
    }
  };

  return {
    run
  };
};

module.exports = MappingFactory;
