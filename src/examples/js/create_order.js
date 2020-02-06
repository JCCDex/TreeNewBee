const fs = require('fs');
const superagent = require('superagent');
const async = require('async')
//const sleep = time => new Promise(resolve => setTimeout(resolve, time));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
var Remote = require('jingtum-lib').Remote;
var jtTraction = require('./jtTraction');
const BigNumber = require('bignumber.js');
var program = require('commander');
var Wallet = require('jingtum-base-lib').Wallet;

program.version('1.0.0');
program.usage('-t [type, buy/sell/cancle] -P [pairs SWT-JJCC] -p [price] -a [amount] -s [sequence]  -S [wallet secret]', 'create and cancle order');
program.option('-t, --type <buy/sell/cancle/depth/robot>', 'order type');
program.option('-P, --pairs <SWT-JJCC>', 'order pairs');
program.option('-S, --secret <wallet secret>', 'wallet secret');
program.option('-p, --price <price>', 'order price');
program.option('-a, --amount <amount>', 'order amount');
program.option('-s, --sequence <order sequence>', 'database user password');
program.parse(process.argv);

if (!program.type) {
    console.log('Must specify a order type');
    process.exit();
}

if (program.type === 'cancle') {
    if (!program.sequence) {
        console.log('Must specify a order sequence');
        process.exit();
    }

    if (!program.secret) {
        console.log('Must specify a order secret');
        process.exit();
    }
} else if (program.type === 'depth') {
    if (!program.pairs) {
        console.log('Must specify a order pairs');
        process.exit();
    }
} else {
    if (!program.secret) {
        console.log('Must specify a order secret');
        process.exit();
    }

    if (!program.pairs) {
        console.log('Must specify a order pairs');
        process.exit();
    }

    if (!program.price) {
        console.log('Must specify a order price');
        process.exit();
    }

    if (!program.amount) {
        console.log('Must specify a order amount');
        process.exit();
    }
}

var connect = function () {

    var i = 0;
    var remote = null;
    var _config = JSON.parse(fs.readFileSync("config.json", 'utf-8'));
    var jtServerList = _config.jt_server;
    var pt = 0;
    var total = new BigNumber(0);
    var jtServer = jtServerList[0];

    remote = new Remote({ server: jtServer, local_sign: false });
    remote.connect(async function (err, data) {
        // console.log(new Date());
        // await delay(30000);
        // console.log(new Date());
        // return;
        i++;
        i = i % jtServerList.length;
        if (err) {
            console.log((new Date()).toISOString() + ' fail connect jingtum server:' + jtServer + ', ' + err);
            connect(jtServerList[i]);
        } else {
            console.log((new Date()).toISOString() + ' success connect jingtum server:' + jtServer);
            jtTraction.init(remote);
            if (program.type === 'buy') {
                console.log(program.pairs, program.price, program.amount, program.secret);
                var ret = await jtTraction.buyOrder(program.pairs, new BigNumber(program.price), new BigNumber(program.amount), program.secret);
                console.log('order sequence', ret);
                remote.disconnect();
                process.exit(0);
                return;
            } else if (program.type === 'sell') {
                var ret = await jtTraction.sellOrder(program.pairs, new BigNumber(program.price), new BigNumber(program.amount), program.secret);
                console.log('order sequence', ret);
                remote.disconnect();
                process.exit(0);
                return;
            } else if (program.type === 'cancle') {
                if(program.sequence >=0) { //指定sequence撤单
                    var ret = await jtTraction.cancelOrder(program.sequence, program.secret);
                    console.log(ret) 
                } else { //批量撤单
                    var orderList = await jtTraction.getOrders(program.secret);
                    for(var j=0; j<orderList.length; j++) {
                        var ret = await jtTraction.cancelOrder(orderList[j].sequence, program.secret);
                    }
                    console.log("批量撤单成功"); 
                }
                
                remote.disconnect();
                process.exit(0);
                return;
            } else if (program.type === 'depth') {
                remote.on('ledger_closed', async function (msg) {
                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
                    var ret = await jtTraction.getDepth(program.pairs);
                    for (var i = ret.asks.length - 1, n = i; i >= 0; i-- , n--) {
                        console.log('卖' + (n + 1), '价格:', ret.asks[i].price, '数量:', ret.asks[i].amount, '地址:', ret.asks[i].order_maker);
                    }
                    console.log("---------------------------------------------------------------------------------")
                    for (var j = 0; j < ret.bids.length; j++) {
                        console.log('买' + (j + 1), '价格:', ret.bids[j].price, '数量:', ret.bids[j].amount, '地址:', ret.bids[j].order_maker);
                    }
                    //console.log(ret)
                });
            }else if (program.type === 'robot') {
                var action = "buy";
                var buySequence = -1;
                var sellSequence = -1;
                remote.on('ledger_closed', async function (msg) {
                    var wallet = Wallet.fromSecret(program.secret)
                    var ret = await jtTraction.getDepth(program.pairs);
                    if(action === "buy") {
                        if(wallet.address == ret.bids[0].order_maker) {
                            return;
                        } else {
                            var buy1Price = ret.bids[0].price;
                            if(buySequence >=0) {
                                await jtTraction.cancelOrder(buySequence, program.secret);
                            }
                            buy1Price =  new BigNumber(buy1Price).plus(0.000000001)
                            var ret = await jtTraction.buyOrder(program.pairs, buy1Price, new BigNumber(program.amount), program.secret);
                            // var buy1Amount = 0;
                            // for (var i = 0; i < ret.bids.length; i++) {
                            //     var x = new BigNumber(buy1Price).isEqualTo(ret.bid[i].price);
                            //     if(x) {
                            //         buy1Amount = buy1Amount + ret.bid[i].amount;
                            //     }
                            // }
                        }

                    } else {
                        if(wallet.address == ret.bids[ret.asks.length - 1].order_maker) {
                            return;
                        } else {
                            var sell1Price = ret.asks[ret.asks.length - 1].price;
                        }
                        // var sell1Amount = 0;
                        // for (var i = ret.asks.length - 1, n = i; i >= 0; i-- , n--) {
                        //     var x = new BigNumber(sell1Price).isEqualTo(ret.asks[i].price);
                        //     if(x) {
                        //         sell1Amount = sell1Amount + ret.asks[i].amount;
                        //     }
                        // }
                    }
                    
                    
                    //console.log(ret)
                });
            }
        }
    });
};

connect();
