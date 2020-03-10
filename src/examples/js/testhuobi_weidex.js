const log = require("ololog").configure({ locate: false });
const ccxt = require("../../ccxt");
const Configs = require("./testconfig");
const weidex = new ccxt["weidex"]({
  address: Configs.jingtumHuobi.address,
  secret: Configs.jingtumHuobi.secret,
  enableRateLimit: true
});
const huobipro = new ccxt["huobipro"]({
  apiKey: Configs.huobi.access_key,
  secret: Configs.huobi.secretkey,
  verbose: false, // set to true to see more debugging output
  timeout: 60000,
  enableRateLimit: true, // add this
  urls: {
    api: {
      market: Configs.huobi.market,
      public: Configs.huobi.public,
      private: Configs.huobi.private,
      zendesk: Configs.huobi.zendesk
    }
  },
  hostname: Configs.huobi.hostname // ←---------------  ADD THIS
});

// huobis orders move to weidex
const run = async function() {
  const configs = await weidex.fetch(Configs.weidexConfig.jc_config);
  console.log(configs);
  weidex.configs = configs;

  const coinpairConfigs = await weidex.fetch(Configs.weidexConfig.coins_pairs_config);
  console.log(coinpairConfigs);
  weidex.coinpairConfigs = coinpairConfigs;
  let marketWeidex = await weidex.fetchMarkets();
  let marketHuobipro = await huobipro.fetchMarkets();
  let orders = [];
  let number = Math.floor(Math.random() * 10 + 20); //数量
  let stepIndex = 1; //深度排序
  // let usdt_price_scale = 0.971791255
  const usdt_price_scale = 1;
  //删除所有订单
  let pairs = Configs.tradePairs;
  pairs.forEach((pair) => {
    huobipro.fetchOpenOrders(pair).then((orders) => {
      if (orders.length > 0) {
        orders.forEach((element) => {
          huobipro.cancelOrder(element.id).then((data) => {
            console.log(data);
          });
        });
      }
    });
    //     let randomNum=Math.random() * 10
    //    if(randomNum%2===0){
    weidex.fetchOrders(pair).then((orders) => {
      if (orders.length > 0) {
        orders.forEach((element) => {
          weidex.cancelOrder(element.id).then((data) => {
            console.log(data);
          });
        });
      }
    });
    // }

    //根据资金判断是买还是卖
    setTimeout(() => {
      huobipro.fetchOrderBook(pair).then((prices) => {
        console.log(prices);
        huobipro.fetchBalance().then((balance) => {
          if (balance) {
            let base = pair.split("/")[0];
            let counter = pair.split("/")[1];
            let balance_base = balance[base];
            let balance_counter = balance[counter];
            if (prices && balance && balance_base.free > 0 && balance_counter.free > 0) {
              if (balance_base.free * prices.bids[stepIndex][0] < balance_counter.free) {
                huobipro.createOrder(pair, "limit", "buy", number, prices.bids[stepIndex][0]).then((res) => {
                  console.log(res);
                  this.current_deal_price = prices.bids[stepIndex][0];
                  orders.push(res);
                });
              } else {
                // createOrder(pair, "sell", bid_amount, max_bid1)
                huobipro.createOrder(pair, "limit", "sell", number, prices.asks[stepIndex][0]).then((res) => {
                  console.log(res);
                  this.current_deal_price = prices.asks[stepIndex][0];
                  orders.push(res);
                });
              }
            }
          }
        });
      });
    }, 10000);
  });

  this.timer = setInterval(() => {
    if (orders.length > 0) {
      orders.forEach((o) => {
        if (o) {
          huobipro.fetchOrder(o.id).then(async (element) => {
            if (element) {
              console.log(JSON.stringify(element));
              if (element.filled === number) {
                if (element.side === "buy") {
                  huobipro.fetchOrderBook(element.symbol).then((prices) => {
                    console.log(prices);
                    if (prices && prices.asks[stepIndex][0] > this.current_deal_price) {
                      huobipro.createOrder(element.symbol, "limit", "sell", number, prices.asks[stepIndex][0]).then((res) => {
                        console.log(res);
                        this.current_deal_price = prices.asks[stepIndex][0];
                        orders.push(res);
                      });
                    }
                  });
                  weidex.createOrder(element.symbol, "sell", element.amount, element.price);
                } else if (element.side === "sell") {
                  weidex.createOrder(element.symbol, "buy", element.amount, element.price);
                  huobipro.fetchOrderBook(element.symbol).then((prices) => {
                    console.log(prices);
                    if (prices && prices.bids[stepIndex][0] < this.current_deal_price) {
                      huobipro.createOrder(element.symbol, "limit", "buy", number, prices.bids[stepIndex][0]).then((res) => {
                        console.log(res);
                        this.current_deal_price = prices.bids[stepIndex][0];
                        orders.push(res);
                      });
                    }
                  });
                }
                console.log(orders);
                let list = orders.filter((o) => o != element.id);
                orders = list;
                console.log(orders);
              }
              // });
            }
          });
        }
      });
    }
  }, 10000);
};
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
