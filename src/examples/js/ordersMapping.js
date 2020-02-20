const Configs = require("./testconfig");
const util = require("./utils");
var number = 0; //挂单数量
const stepIndex = 1; //委托档位排序
let pairs = Configs.tradePairs;
const run = async function() {
  number = Math.floor(Math.random() * 10 + 20); //数量
  Configs.exchanges.forEach(async (o) => {
    let ex0 = await util.utils.getExchange(o[0]);
    let ex1 = await util.utils.getExchange(o[1]);
    let exchanges = { exPair: [ex0, ex1], orders: [] };
    clearAllExchangeOrders(exchanges.exPair);
    pairs.forEach((pair) => {
      initOrders(exchanges, pair);
    });
    refershStatus(exchanges);
  });
};
//清理所有交易所订单
function clearAllExchangeOrders(exchanges) {
  pairs.forEach((pair) => {
    exchanges.forEach((ex) => {
      clearOrders(ex, pair);
    });
  });
}
//删除所有订单
function clearOrders(ex, pair) {
  ex.fetchOpenOrders(pair).then((orders) => {
    if (orders && orders.length > 0) {
      orders.forEach((element) => {
        ex.cancelOrder(element.id, pair).then((data) => {
          console.log(data);
        });
      });
    }
  });
}

//根据资金情况判断是买还是卖
function initOrders(exs, pair) {
  exs.exPair[0].fetchOrderBook(pair).then((prices) => {
    exs.exPair[0].fetchBalance().then((balance) => {
      let base = pair.split("/")[0];
      let counter = pair.split("/")[1];
      let balance_base = balance[base];
      let balance_counter = balance[counter];
      if (prices && balance && balance_base.free > 0 && balance_counter.free > 0) {
        if (balance_base.free * prices.bids[stepIndex][0] < balance_counter.free) {
          exs.exPair[0].createOrder(pair, "limit", "buy", number, prices.bids[stepIndex][0]).then((res) => {
            console.log(res);
            this.current_deal_price = prices.bids[stepIndex][0];
            exs.orders.push(res);
          });
        } else {
          exs.exPair[0].createOrder(pair, "limit", "sell", number, prices.asks[stepIndex][0]).then((res) => {
            console.log(res);
            this.current_deal_price = prices.asks[stepIndex][0];
            exs.orders.push(res);
          });
        }
      }
    });
  });
}
//刷新状态
function refershStatus(exchanges) {
  this.timer = setInterval(() => {
    watchOrders(exchanges);
  }, 10000);
}
//监控订单情况
function watchOrders(exs) {
  if (exs.orders.length > 0) {
    exs.orders.forEach((o) => {
      exs.exPair[0].fetchOrder(o.id).then(async (element) => {
        if (element && element.filled === number) {
          orderOpposite(element, exs);
        }
      });
    });
  }
}
//订单成交后挂相反方向单
function orderOpposite(element, exs) {
  if (element.side === "buy") {
    exs.exPair[0].fetchOrderBook(element.symbol).then((prices) => {
      if (prices && prices.asks[stepIndex][0] > this.current_deal_price) {
        exs.exPair[0].createOrder(element.symbol, "limit", "sell", number, prices.asks[stepIndex][0]).then((res) => {
          console.log(res);
          this.current_deal_price = prices.asks[stepIndex][0];
          exs.orders.push(res);
        });
      }
    });
    exs.exPair[1].createOrder(element.symbol, "limit", "sell", element.amount, element.price);
  } else if (element.side === "sell") {
    exs.exPair[0].fetchOrderBook(element.symbol).then((prices) => {
      if (prices && prices.bids[stepIndex][0] < this.current_deal_price) {
        exs.exPair[0].createOrder(element.symbol, "limit", "buy", number, prices.bids[stepIndex][0]).then((res) => {
          console.log(res);
          this.current_deal_price = prices.bids[stepIndex][0];
          exs.orders.push(res);
        });
      }
    });
    exs.exPair[1].createOrder(element.symbol, "limit", "buy", element.amount, element.price);
  }
  let list = exs.orders.filter((o) => o.id != element.id);
  exs.orders = list;
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
