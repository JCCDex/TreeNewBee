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

const okex3 = new ccxt['okex3']({
    "apiKey": Configs.okex.access_key,
    "secret": Configs.okex.secretkey,
    'verbose': false, // set to true to see more debugging output
    'timeout': 60000,
    'enableRateLimit': true,
    'password': Configs.okex.privatekey
})
const weidex2 = new ccxt['weidex']({
    address: Configs.jingtum2.address,
    secret: Configs.jingtum2.secret,
    enableRateLimit: true,
})
var number = 0;
const stepIndex = 1//深度排序
// mapping orders
const run = async function () {
    const configs = await weidex1.fetch(Configs.weidexConfig.jc_config)
    weidex1.configs = configs
    weidex2.configs = configs
    const coinpairConfigs = await weidex1.fetch(Configs.weidexConfig.coins_pairs_config)
    weidex1.coinpairConfigs = coinpairConfigs
    weidex2.coinpairConfigs = coinpairConfigs
    let marketWeidex1 = await weidex1.fetchMarkets()
    let marketHuobipro = await huobipro.fetchMarkets()
    let marketOkex3 = await okex3.fetchMarkets()
    number = Math.floor(Math.random() * 10 + 20);//数量
    let exchanges = [{ "exPair": [huobipro, weidex1], "orders": [] }, { "exPair": [okex3, weidex1], "orders": [] }]
    clearAllExchangeOrders(exchanges)
    initOrders(exchanges)
    refershStatus(exchanges)
}
//清理所有交易所订单
function clearAllExchangeOrders(exchanges) {
    let pairs = Configs.tradePairs
    pairs.forEach(pair => {
        exchanges.forEach(exs => {
            exs.exPair.forEach(ex => {
                clearOrders(ex)
            })
        })
    });
}
//删除所有订单
function clearOrders(ex) {
    ex.fetchOpenOrders(pair).then(orders => {
        if (orders.length > 0) {
            orders.forEach(element => {
                ex.cancelOrder(element.id).then(data => {
                    console.log(data)
                })
            });
        }
    });
}

//初始化订单
function initOrders(exchanges) {
    exchanges.forEach(exs => {
        initOrder(exs)
    })
}

//根据资金情况判断是买还是卖
function initOrder(exs) {
    exs.exPair[0].fetchOrderBook(pair).then(prices => {
        exs.exPair[0].fetchBalance().then(balance => {
            if (balance) {
                let base = pair.split("/")[0]
                let counter = pair.split("/")[1]
                let balance_base = balance[base];
                let balance_counter = balance[counter];
                if (prices && balance && balance_base.free > 0 && balance_counter.free > 0) {
                    if (balance_base.free * prices.bids[stepIndex][0] < balance_counter.free) {
                        exs.exPair[0].createOrder(pair, "limit", "buy", number, prices.bids[stepIndex][0]).then(res => {
                            console.log(res)
                            this.current_deal_price = prices.bids[stepIndex][0]
                            exs.orders.push(res)
                        });
                    } else {
                        // createOrder(pair, "sell", bid_amount, max_bid1)
                        exPair[0].createOrder(pair, "limit", "sell", number, prices.asks[stepIndex][0]).then(res => {
                            console.log(res)
                            this.current_deal_price = prices.asks[stepIndex][0]
                            exs.orders.push(res)
                        });
                    }
                }
            }
        });
    });
}
//刷新状态
function refershStatus(exchanges) {
    this.timer = setInterval(() => {
        exchanges.forEach(exs => { watchOrders(exs) })
    }, 10000);
}
//监控订单情况
function watchOrders(exs) {
    if (exs.orders.length > 0) {
        exs.orders.forEach(o => {
            if (o) {
                exs.exPair[0].fetchOrder(o.id).then(async element => {
                    if (element) {
                        if (element.filled === number) {
                            if (element.side === "buy") {
                                exs.exPair[0].fetchOrderBook(element.symbol).then(prices => {
                                    if (prices && prices.asks[stepIndex][0] > this.current_deal_price) {
                                        exs.exPair[0].createOrder(element.symbol, "limit", "sell", number, prices.asks[stepIndex][0]).then(res => {
                                            console.log(res)
                                            this.current_deal_price = prices.asks[stepIndex][0]
                                            exs.orders.push(res)
                                        });
                                    }
                                });
                                exs.exPair[1].createOrder(element.symbol,"limit", "sell", element.amount, element.price)
                            } else if (element.side === "sell") {
                                exs.exPair[1].createOrder(element.symbol,"limit", "buy", element.amount, element.price)
                                exs.exPair[0].fetchOrderBook(element.symbol).then(prices => {
                                    if (prices && prices.bids[stepIndex][0] < this.current_deal_price) {
                                        exs.exPair[0].createOrder(element.symbol, "limit", "buy", number, prices.bids[stepIndex][0]).then(res => {
                                            console.log(res)
                                            this.current_deal_price = prices.bids[stepIndex][0]
                                            exs.orders.push(res)
                                        });
                                    }
                                });
                            }
                            let list = exs.orders.filter(o => o != element.id)
                            orders2 = list
                        }
                    }
                });
            }
        })
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
init()
module.exports = {
    init
};
