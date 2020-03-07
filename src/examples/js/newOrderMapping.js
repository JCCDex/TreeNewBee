const Configs = require("./testconfig");
const util = require("./utils");
let pairs = Configs.tradePairs;
const run = async function() {
  Configs.exchanges.forEach(async (o) => {
    let ex0 = await util.utils.getExchange(o[0]);
    let ex1 = await util.utils.getExchange(o[1]);
    pairs.forEach((pair) => {
      clearOrders(ex1, pair);
      placeOrders(ex0, ex1, pair);
    });
  });
};

//删除所有订单
function clearOrders(ex, pair) {
  ex.fetchOpenOrders(pair).then(async (orders) => {
    if (orders && orders.length > 0) {
      for (let index = 0; index < orders.length; index++) {
        const order = orders[index];
        let res = await ex.cancelOrder(order.id, pair);
        console.log(res);
      }
    }
  });
}

//获取映射交易所市场挂单
function placeOrders(ex0, ex1, pair) {
  ex0.fetchOrderBook(pair).then((prices) => {
    ex1.fetchBalance().then((balance) => {
      let base = pair.split("/")[0];
      let counter = pair.split("/")[1];
      let balance_base = balance[base];
      let balance_counter = balance[counter];
      if (prices && balance && balance_base.free > 0 && balance_counter.free > 0) {
        if (balance_base.free * prices.bids[0][0] < balance_counter.free) {
          createOrders(ex1, pair, "buy", prices.bids.slice(0, 10));
        } else {
          createOrders(ex1, pair, "sell", prices.asks.slice(0, 10));
        }
      }
    });
  });
}

async function createOrders(ex, pair, side, orders) {
  for (let index = 0; index < orders.length; index++) {
    const order = orders[index];
    let number = Math.floor(Math.random() * 10); //数量
    let res = await ex.createOrder(pair, "limit", side, number, order[0]);
    console.log(res);
  }
}

run();

function init() {
  setInterval(() => {
    if (this.timer) {
      clearInterval(this.timer);
    }
    run();
  }, 60000);
}
init();
module.exports = {
  init
};
