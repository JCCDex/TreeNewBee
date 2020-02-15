const Configs = require('./testconfig')
const util = require('./utils')
let pairs = Configs.tradePairs
const run = async function () {
    Configs.exchanges.forEach(async o => {
        let ex0 = await util.utils.getExchange(o[0])
        let ex1 = await util.utils.getExchange(o[1])
        pairs.forEach(pair => {
            clearOrders(ex1, pair)
            placeOrders(ex0, ex1, pair)
        });
    })
}

//删除所有订单
function clearOrders(ex, pair) {
    ex.fetchOpenOrders(pair).then(orders => {
        if (orders && orders.length > 0) {
            orders.forEach(element => {
                ex.cancelOrder(element.id, pair).then(data => {
                    console.log(data)
                })
                sleep(3000)
            });
        }
    });
}

//获取映射交易所市场挂单
function placeOrders(ex0, ex1, pair) {
    ex0.fetchOrderBook(pair).then(prices => {
        ex1.fetchBalance().then(balance => {
            let base = pair.split("/")[0]
            let counter = pair.split("/")[1]
            let balance_base = balance[base];
            let balance_counter = balance[counter];
            if (prices && balance && balance_base.free > 0 && balance_counter.free > 0) {
                if (balance_base.free * prices.bids[stepIndex][0] < balance_counter.free) {
                    createOrders(ex1, pair, "buy", prices.bids.slice(0,10) )
                } else {
                    createOrders(ex1, pair, "sell", prices.asks.slice(0,10) )
                }
            }
        });
    });
}

function createOrders(ex, pair, side, orders) {
    orders.forEach(order => {
        let number = Math.floor(Math.random() * 10);//数量
        ex.createOrder(pair, "limit", side, number, order[0])
        sleep(3000)
    });
}

function sleep(numberMillis) { 
    var now = new Date(); 
    var exitTime = now.getTime() + numberMillis; 
    while (true) { 
    now = new Date(); 
    if (now.getTime() > exitTime) 
    return; 
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
