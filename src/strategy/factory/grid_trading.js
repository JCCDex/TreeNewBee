const assert = require("assert");
const BigNumber = require("bignumber.js");

const GridTradingFactory = (Exchange) => {
  const targetName = Exchange.name;

  const getRandom = (min, max) => {
    const value = max
      .minus(min)
      .multipliedBy(Math.random())
      .plus(min)
      .toFixed(5);
    return value;
  };

  const createOrders = async ({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type }) => {
    const orders = [];
    try {
      const marketsInfo = await Exchange.loadMarkets();
      const limits = marketsInfo[pair].limits;
      const costMin = limits.cost.min || 0;
      const amountMin = limits.amount.min || 0;
      console.log(`${targetName} cost min: `, costMin);
      console.log(`${targetName} amount min: `, amountMin);

      for (let index = 0; index < quantity; index++) {
        try {
          const price = getRandom(lowPrice, highPrice);
          const amount = getRandom(lowAmount, highAmount);
          if (new BigNumber(amount).lt(amountMin) || new BigNumber(amount).multipliedBy(price).lt(costMin)) {
            console.log(`不符合${targetName}最小挂单数量或最小挂单总额`);
            continue;
          }

          console.log(pair);
          let res = await Exchange.createOrder(pair, "limit", type, amount, price);
          console.log("挂单成功:", res);
          orders.push({
            id: res.id,
            pair,
            type,
            amount,
            price
          });
        } catch (error) {
          console.log(error.message);
        }
      }
    } catch (error) {
      console.log(error);
    }
    return orders;
  };

  const startTrading = async ({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type }) => {
    pair = pair.toUpperCase();
    highAmount = new BigNumber(highAmount);
    lowAmount = new BigNumber(lowAmount);
    highPrice = new BigNumber(highPrice);
    lowPrice = new BigNumber(lowPrice);
    quantity = Number(quantity);

    assert(/^[A-Z]+\/[A-Z]+$/.test(pair), "pair should like 'btc/usdt'");
    assert(BigNumber.isBigNumber(lowAmount) && lowAmount.gt(0), "lowAmount should be number and more than 0");
    assert(BigNumber.isBigNumber(highAmount) && highAmount.gt(lowAmount), "highAmount should be number and more than lowAmount");
    assert(BigNumber.isBigNumber(lowPrice) && lowPrice.gt(0), "lowPrice should be number and more than 0");
    assert(BigNumber.isBigNumber(highPrice) && highPrice.gt(lowPrice), "highPrice should be number and more than lowPrice");
    assert(Number.isInteger(quantity) && quantity > 0, "quantity shoule be positive integer");
    assert(/^(buy|sell)$/.test(type), "type shoule be 'buy' or 'sell'");
    const orders = await createOrders({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type });
    return orders;
  };

  return {
    startTrading
  };
};

module.exports = GridTradingFactory;
