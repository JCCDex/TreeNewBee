'use strict';

const log = require('ololog').configure({ locate: false })
const ccxt = require('../../ccxt')
const Configs = require('./testconfig')
const util=require('./utils')


const pairs =  Configs.tradePairs
async function init() {
    pairs.forEach(async pair => {
        let data = []
        for (let index = 0; index < Configs.moveBrickExchanges.length; index++) {
            const element =  Configs.moveBrickExchanges[index];
            let ex = await util.utils.getExchange(element)
            let orders=await ex.fetchOrderBook(pair)
            let ordersInfo={ "key":element, "exchange": ex, "value": orders }
            data.push(ordersInfo)
        }
        // 低买高卖，获取指定交易对的潜在套利最大化的2个交易所，理论上先去ask1卖一最低（卖的最便宜的bid1）的买入，立刻去bid1买一最高（买起来最贵的bid1）卖出
        //最贵的买一 初始化为一个较小值
        let max_bid1 = 0
        //最便宜的卖一 初始化为一个较大值
        let min_ask1 = 10000
        let bid_exchange = null
        let ask_exchange = null
        let bid_amount = null
        let ask_amount = null
        data.forEach(item => {
            let bid1 = item.value['bids'].length > 0 ? item.value['bids'][0][0] : null
            let bid1_amount = item.value['bids'].length > 0 ? item.value['bids'][0][1] : null
            let ask1 = item.value['asks'].length > 0 ? item.value['asks'][0][0] : null
            let ask1_amount = item.value['asks'].length > 0 ? item.value['asks'][0][1] : null
            //比较价格并保存 最低卖一价和最高买一价
            //找到最贵的买一，进行卖操作
            if (bid1 && (bid1 > max_bid1)) {
                max_bid1 = bid1
                bid_exchange = item.key
                bid_amount = bid1_amount
                console.log('get new max_bid1 is ' + max_bid1 + ',exchange is ' + bid_exchange + ',tradingPair is' + pair)
            }

            //找到最便宜的卖一，进行买操作
            if (ask1 && (ask1 < min_ask1)) {
                min_ask1 = ask1
                ask_exchange = item.key
                ask_amount = ask1_amount
                console.log('get new min_ask1 is' + min_ask1 + ',exchange is ' + ask_exchange + ',tradingPair is  ' + pair)
            }
        });
        if (bid_exchange && ask_exchange&&bid_exchange!=ask_exchange) {
            let price_diff = max_bid1 - min_ask1
            let percent = price_diff / min_ask1 * 100
            let trade_volume = min([ask_amount, bid_amount])
            let profits = min_ask1 * trade_volume * percent / 100
            console.log('\n\n++++++++ symbol ' + pair + ' find good exchange,\n percent {' + percent + '}%,price_diff {' + price_diff + '},trade_volume {' + trade_volume + '},profits {' + profits + '},' + '\nbuy at {' + min_ask1 + '},{' + ask_amount + '},{' + min_ask1 * ask_amount + '0},{' + ask_exchange + '},\nsell at {' + max_bid1 + '},{' + bid_amount + '},{' + max_bid1 * bid_amount + '},{' + bid_exchange + '}')




            if (price_diff < 0) {
                console.log('oooooooo unlucky symbol {' + pair + '},no pair to make money')
            } else {
                let bidExchange = data.filter(o => o.key == bid_exchange)[0]
                await bidExchange.exchange.createOrder(pair, "limit","sell", bid_amount, max_bid1)
                let askExchange = data.filter(o => o.key == ask_exchange)[0]
                await askExchange.exchange.createOrder(pair, "limit", "buy", ask_amount, min_ask1)
                console.log("create order successful")
            }
        }

        else {
            console.log('\n\n******------ symbol {' + pair + '} not find good exchange')
        }
    });
}
function min(arr) {
    arr = arr.filter(item => !_isNaN(item))
    return arr.length ? Math.min.apply(null, arr) : undefined
}
function _isNaN(v) {
    return !(typeof v === 'string' || typeof v === 'number') || isNaN(v)
}
init();
module.exports = {
    init
  };
