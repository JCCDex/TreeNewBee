const log = require('ololog').configure({ locate: false })
const ccxt = require('../../ccxt')
const Configs = require('./testconfig')
const weidex1 = new ccxt['weidex']({
    address: Configs.jingtum1.address,
    secret: Configs.jingtum1.secret,
    enableRateLimit: true,
})
const huobipro = new ccxt['huobipro']({
    "apiKey": Configs.huobi.access_key,
    "secret": Configs.huobi.secretkey,
    'verbose': false, // set to true to see more debugging output
    'timeout': 60000,
    'enableRateLimit': true
    , // add this
    'urls': {
        'api': {
            'market': Configs.huobi.market,
            'public': Configs.huobi.public,
            'private': Configs.huobi.private,
            'zendesk': Configs.huobi.zendesk,
        }
    },
    'hostname': Configs.huobi.hostname,// ←---------------  ADD THIS
})
const weidex2 = new ccxt['weidex']({
    address: Configs.jingtum2.address,
    secret: Configs.jingtum2.secret,
    enableRateLimit: true,
})
const okex3 = new ccxt['okex3']({
    "apiKey": Configs.okex.access_key,
    "secret": Configs.okex.secretkey,
    'verbose': false, // set to true to see more debugging output
    'timeout': 60000,
    'enableRateLimit': true,
    'password': Configs.okex.privatekey
})


// mapping orders
const run = async function () {
    const configs = await weidex1.fetch(Configs.weidexConfig.jc_config)
    console.log(configs);
    weidex1.configs = configs
    weidex2.configs = configs
    const coinpairConfigs = await weidex1.fetch(Configs.weidexConfig.coins_pairs_config)
    console.log(coinpairConfigs);
    weidex1.coinpairConfigs = coinpairConfigs
    weidex2.coinpairConfigs = coinpairConfigs
    let marketWeidex1 = await weidex1.fetchMarkets()
    let marketHuobipro = await huobipro.fetchMarkets()
    let marketOkex3 = await okex3.fetchMarkets()
    let orders1 = []
    let orders2 = []
    let number = Math.floor(Math.random() * 10 + 20);//数量
    let stepIndex = 1//深度排序
    // let usdt_price_scale = 0.971791255
    const usdt_price_scale = 1
    //删除所有订单
    let pairs = Configs.tradePairs
    pairs.forEach(pair => {
        huobipro.fetchOpenOrders(pair).then(orders => {
            if (orders.length > 0) {
                orders.forEach(element => {
                    huobipro.cancelOrder(element.id).then(data => {
                        console.log(data)
                    })
                });

            }
        });

        weidex1.fetchOrders(pair).then(orders => {
            if (orders.length > 0) {
                orders.forEach(element => {
                    weidex1.cancelOrder(element.id).then(data => {
                        console.log(data)
                    })
                });

            }
        });
        okex3.fetchOpenOrders(pair).then(orders => {
            if (orders.length > 0) {
                orders.forEach(element => {
                    okex3.cancelOrder(element.id).then(data => {
                        console.log(data)
                    })
                });

            }
        });

        weidex2.fetchOrders(pair).then(orders => {
            if (orders.length > 0) {
                orders.forEach(element => {
                    weidex2.cancelOrder(element.id).then(data => {
                        console.log(data)
                    })
                });

            }
        });



        //根据资金判断是买还是卖
        setTimeout(() => {
            huobipro.fetchOrderBook(pair).then(prices => {
                console.log(prices)
                huobipro.fetchBalance().then(balance => {
                    if (balance) {
                        let base = pair.split("/")[0]
                        let counter = pair.split("/")[1]
                        let balance_base = balance[base];
                        let balance_counter = balance[counter];
                        if (prices && balance && balance_base.free > 0 && balance_counter.free > 0) {
                            if (balance_base.free * prices.bids[stepIndex][0] < balance_counter.free) {
                                huobipro.createOrder(pair, "limit", "buy", number, prices.bids[stepIndex][0]).then(res => {
                                    console.log(res)
                                    this.current_deal_price = prices.bids[stepIndex][0]
                                    orders1.push(res)
                                });
                            } else {
                                // createOrder(pair, "sell", bid_amount, max_bid1)
                                huobipro.createOrder(pair, "limit", "sell", number, prices.asks[stepIndex][0]).then(res => {
                                    console.log(res)
                                    this.current_deal_price = prices.asks[stepIndex][0]
                                    orders1.push(res)
                                });
                            }
                        }
                    }
                });
            });
            okex3.fetchOrderBook(pair).then(prices => {
                console.log(prices)
                okex3.fetchBalance().then(balance => {
                    if (balance) {
                        let base = pair.split("/")[0]
                        let counter = pair.split("/")[1]
                        let balance_base = balance[base];
                        let balance_counter = balance[counter];
                        if (prices && balance && balance_base.free > 0 && balance_counter.free > 0) {
                            if (balance_base.free * prices.bids[stepIndex][0] < balance_counter.free) {
                                okex3.createOrder(pair, "limit", "buy", number, prices.bids[stepIndex][0]).then(res => {
                                    console.log(res)
                                    this.current_deal_price = prices.bids[stepIndex][0]
                                    orders2.push(res)
                                });
                            } else {
                                // createOrder(pair, "sell", bid_amount, max_bid1)
                                okex3.createOrder(pair, "limit", "sell", number, prices.asks[stepIndex][0]).then(res => {
                                    console.log(res)
                                    this.current_deal_price = prices.asks[stepIndex][0]
                                    orders2.push(res)
                                });
                            }
                        }
                    }
                });
            });
        }, 10000);
    });


    this.timer = setInterval(() => {
        if (orders1.length > 0) {
            orders1.forEach(o => {
                if (o) {
                    huobipro.fetchOrder(o.id).then(async element => {
                        if (element) {
                            console.log(JSON.stringify(element))
                            if (element.filled === number) {
                                if (element.side === "buy") {
                                    huobipro.fetchOrderBook(element.symbol).then(prices => {
                                        console.log(prices)
                                        if (prices && prices.asks[stepIndex][0] > this.current_deal_price) {
                                            huobipro.createOrder(element.symbol, "limit", "sell", number, prices.asks[stepIndex][0]).then(res => {
                                                console.log(res)
                                                this.current_deal_price = prices.asks[stepIndex][0]
                                                orders1.push(res)
                                            });
                                        }
                                    });
                                    weidex1.createOrder(element.symbol, "sell", element.amount, element.price)
                                } else if (element.side === "sell") {
                                    weidex1.createOrder(element.symbol, "buy", element.amount, element.price)
                                    huobipro.fetchOrderBook(element.symbol).then(prices => {
                                        console.log(prices)
                                        if (prices && prices.bids[stepIndex][0] < this.current_deal_price) {
                                            huobipro.createOrder(element.symbol, "limit", "buy", number, prices.bids[stepIndex][0]).then(res => {
                                                console.log(res)
                                                this.current_deal_price = prices.bids[stepIndex][0]
                                                orders1.push(res)
                                            });
                                        }
                                    });
                                }
                                console.log(orders1)
                                let list = orders1.filter(o => o != element.id)
                                orders1 = list
                                console.log(orders1)
                            }
                            // });
                        }

                    });
                }
            })
        }
        if (orders2.length > 0) {
            orders2.forEach(o => {
                if (o) {
                    okex3.fetchOrder(o.id).then(async element => {
                        if (element) {
                            console.log(JSON.stringify(element))
                            if (element.filled === number) {
                                if (element.side === "buy") {
                                    okex3.fetchOrderBook(element.symbol).then(prices => {
                                        console.log(prices)
                                        if (prices && prices.asks[stepIndex][0] > this.current_deal_price) {
                                            okex3.createOrder(element.symbol, "limit", "sell", number, prices.asks[stepIndex][0]).then(res => {
                                                console.log(res)
                                                this.current_deal_price = prices.asks[stepIndex][0]
                                                orders2.push(res)
                                            });
                                        }
                                    });
                                    weidex1.createOrder(element.symbol, "sell", element.amount, element.price)
                                } else if (element.side === "sell") {
                                    weidex1.createOrder(element.symbol, "buy", element.amount, element.price)
                                    okex3.fetchOrderBook(element.symbol).then(prices => {
                                        console.log(prices)
                                        if (prices && prices.bids[stepIndex][0] < this.current_deal_price) {
                                            okex3.createOrder(element.symbol, "limit", "buy", number, prices.bids[stepIndex][0]).then(res => {
                                                console.log(res)
                                                this.current_deal_price = prices.bids[stepIndex][0]
                                                orders2.push(res)
                                            });
                                        }
                                    });
                                }
                                console.log(orders2)
                                let list = orders2.filter(o => o != element.id)
                                orders2 = list
                                console.log(orders2)
                            }
                        }
                    });
                }
            })
        }
    }, 10000);
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
init()
module.exports = {
    init
};
