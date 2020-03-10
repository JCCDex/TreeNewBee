"use strict";
const Configs = require("./config");
const util = require("./utils");
const math = require("./math");
var getATicker = async function(pair) {
  const element = Configs.moveBrickExchanges[1];
  let ex = await util.utils.getExchange(element);
  let orders = await ex.fetchOrderBook(pair);
  return orders;
};

var hasBenefit = async function(coin, mainCoin) {
  const mainCoin2usdt = await getATicker(`${mainCoin}/USDT`);
  if (!mainCoin2usdt) {
    return;
  }
  const coin2usdt = await getATicker(`${coin}/USDT`);
  if (!coin2usdt) {
    return;
  }
  const coin2mainCoin = await getATicker(`${coin}/${mainCoin}`);
  if (!coin2mainCoin) {
    return;
  }
  const putCount = Math.min(mainCoin2usdt.bids[0][1], coin2usdt.asks[0][1], coin2mainCoin.bids[0][1]);
  const moreUsdt = math.eval(`${mainCoin2usdt.bids[0][0]} * ${coin2mainCoin.bids[0][0]} * ${putCount} - ${coin2usdt.asks[0][0]} * ${putCount}`);
  const serviceCharge = math.eval(`(${coin2usdt.asks[0][0]} * 2 + ${coin2mainCoin.bids[0][0]} * ${mainCoin2usdt.bids[0][0]}) * ${putCount} * 0.004`);
  if (moreUsdt > serviceCharge) {
    // XRP/SWTC 市场卖出一定数量 Q3 的 XRP，同时在 XRP/USDT 市场买入数量为 Q3 的 XRP，在 SWTC/USDT 市场卖出数量为 P3 * Q3 的 SWTC
    console.log(`${coin}-${mainCoin}：需 ${putCount} USDT，赚：`, math.eval(`${moreUsdt} - ${serviceCharge}`) + " USDT，百分比：", math.eval(`(${moreUsdt} - ${serviceCharge}) / ${putCount} * 100`));
  } else {
    console.warn(`${coin}-${mainCoin}：需 ${putCount} USDT，亏：`, math.eval(`${moreUsdt} - ${serviceCharge}`) + " USDT，百分比：", math.eval(`(${moreUsdt} - ${serviceCharge}) / ${putCount} * 100`));
  }

  const putCount1 = Math.min(mainCoin2usdt.asks[0][1], coin2usdt.bids[0][1], coin2mainCoin.asks[0][1]);
  const moreUsdt1 = math.eval(`${coin2usdt.bids[0][0]} * ${putCount1} - ${mainCoin2usdt.asks[0][0]} * ${coin2mainCoin.asks[0][0]} * ${putCount1}`);
  const serviceCharge1 = math.eval(`(${coin2usdt.bids[0][0]} + ${coin2mainCoin.asks[0][0]} * ${mainCoin2usdt.asks[0][0]} * 2) * ${putCount1} * 0.000`);
  if (moreUsdt1 > serviceCharge1) {
    // 就在 XRP/SWTC 市场买入一定数量 Q3 的 XRP，同时在 XRP/USDT 市场卖出数量为 Q3 的 XRP，在 SWTC/USDT 市场买入数量为 P3 * Q3 的 SWTC
    console.log(`反向 ${coin}-${mainCoin}：需 ${putCount1} USDT，赚：`, math.eval(`${moreUsdt1} - ${serviceCharge1}`) + " USDT，百分比：", math.eval(`(${moreUsdt1} - ${serviceCharge1}) / ${putCount1} * 100`));
  } else {
    console.warn(`反向 ${coin}-${mainCoin}：需 ${putCount1} USDT，亏：`, math.eval(`${moreUsdt1} - ${serviceCharge1}`) + " USDT，百分比：", math.eval(`(${moreUsdt1} - ${serviceCharge1}) / ${putCount1} * 100`));
  }
  checkThreeCorner();
};

// sleep(60000);
function checkThreeCorner() {
  var coins = ["XRP"];
  // coins = ['eos', 'bcc', 'eth', 'xrp', 'ltc', 'dash', 'etc', 'eos', 'omg', 'zec']
  for (var i = 0, iMax = coins.length; i < iMax; i++) {
    hasBenefit(coins[i], "SWTC");
    // hasBenefit(coins[i], 'eth')
  }
}

function init() {
  setInterval(() => {
    checkThreeCorner();
  }, 30000);
}
init();
module.exports = {
  init
};
