const BigNumber = require("bignumber.js");
const config = require("./config");
const pairs = config.tradePairs;
const profit = config.arbitrageProfit;

// bids买单，asks卖单
const ArbitrageFactory = (targetExchange, weidexExchange) => {
  const targetName = targetExchange.name;
  const weidexName = weidexExchange.name;

  const run = () => {
    for (const pair of pairs) {
      startArbitrage(pair);
    }
  };

  const startArbitrage = async (pair) => {
    console.log(`------${pair}套利开始------`);
    try {
      const marketsInfo = await targetExchange.loadMarkets();
      const limits = marketsInfo[pair].limits;
      const costMin = limits.cost.min;
      const amountMin = limits.amount.min;
      console.log(`${targetName} cost min: `, costMin);
      console.log(`${targetName} amount min: `, amountMin);

      const [targetBalance, weidexBalance] = await Promise.all([targetExchange.fetchBalance(), weidexExchange.fetchBalance()]);
      const [base, counter] = pair.split("/");
      if (!targetBalance[base]) {
        console.log(`${targetName} ${base} token不存在`);
        process.exit(0);
      }
      if (!targetBalance[counter]) {
        console.log(`${targetName} ${counter} token不存在`);
        process.exit(0);
      }
      const target_base_free = targetBalance[base].free;
      const target_counter_free = targetBalance[counter].free;
      const weidex_base_free = weidexBalance[base].free;
      const weidex_counter_free = weidexBalance[counter].free;

      console.log(`${targetName} ${base}可用余额: `, target_base_free);
      console.log(`${targetName} ${counter}可用余额: `, target_counter_free);
      console.log(`${weidexName} ${base}可用余额: `, weidex_base_free);
      console.log(`${weidexName} ${counter}可用余额: `, weidex_counter_free);

      const markets = await Promise.all([targetExchange.fetchOrderBook(pair), weidexExchange.fetchOrderBook(pair)]);
      const [targetMarkets, weidexMarkets] = markets;

      // target买一单(最高价)
      const maxTargetBid = targetMarkets.bids[0];
      // target卖一单(最低价)
      const minTargetAsk = targetMarkets.asks[0];

      console.log(`${targetName} ${pair}最高价买单：`, maxTargetBid);
      console.log(`${targetName} ${pair}最低价卖单：`, minTargetAsk);

      const matchWeidexAsks = weidexMarkets.asks.filter((ask) => {
        return new BigNumber(maxTargetBid[0])
          .div(ask[0])
          .minus(1)
          .isGreaterThanOrEqualTo(profit);
      });

      const matchWeidexBids = weidexMarkets.bids.filter((bid) => {
        return new BigNumber(bid[0])
          .div(minTargetAsk[0])
          .minus(1)
          .isGreaterThanOrEqualTo(profit);
      });

      console.log("matchWeidexAsks: ", matchWeidexAsks);
      console.log("matchWeidexBids: ", matchWeidexBids);

      // weidex买, 目标交易所卖
      if (matchWeidexAsks.length > 0) {
        // 以huobi上XRP/USDT为例
        // weidex上用usdt买xrp, huobi上卖xrp
        console.log(`${weidexName}买, ${targetName}卖`);
        const weidexPrice = matchWeidexAsks[matchWeidexAsks.length - 1][0];
        const weidexAmount = matchWeidexAsks.map((ask) => ask[1]).reduce((total, amount) => new BigNumber(total).plus(amount).toNumber());
        console.log("weidex price:", weidexPrice);
        console.log("weidex match total amount:", weidexAmount);
        const [targetPrice, targetAmount] = maxTargetBid;
        let amount = weidexAmount > targetAmount ? targetAmount : weidexAmount;
        amount = new BigNumber(amount).gt(target_base_free) ? target_base_free : amount;

        if (new BigNumber(amount).lt(amountMin) || new BigNumber(amount).multipliedBy(targetPrice).lt(costMin)) {
          console.log(`不符合${targetName}最小挂单数量或最小挂单总额`);
          return;
        }

        // 检查weidex counter数量
        if (
          new BigNumber(amount)
            .multipliedBy(weidexPrice)
            .multipliedBy(1.001)
            .gt(weidex_counter_free)
        ) {
          console.log(`${weidexName} ${counter}余额不足`);
          return;
        }

        // 检查目标交易所 base数量
        if (new BigNumber(amount).lt(target_base_free)) {
          console.log(`${targetName} ${base}余额不足`);
          return;
        }

        await targetExchange.createOrder(pair, "limit", "sell", amount, targetPrice);
        await weidexExchange.createOrder(pair, "buy", amount, new BigNumber(weidexPrice).multipliedBy(1.001).toNumber());
      }
      // weidex卖, 目标交易所买
      else if (matchWeidexBids.length > 0) {
        // 以huobi上XRP/USDT为例
        // huobi上用usdt买xrp, weidex上卖xrp
        console.log(`${weidexName}卖, ${targetName}买`);
        const weidexPrice = matchWeidexBids[matchWeidexBids.length - 1][0];
        const weidexAmount = matchWeidexBids.map((bid) => bid[1]).reduce((total, amount) => new BigNumber(total).plus(amount).toNumber());
        console.log("weidex price:", weidexPrice);
        console.log("weidex match total amount:", weidexAmount);
        const [targetPrice, targetAmount] = minTargetAsk;
        let amount = weidexAmount > targetAmount ? targetAmount : weidexAmount;
        amount = new BigNumber(amount).gt(weidex_base_free) ? weidex_base_free : amount;

        // 检查挂单数量和总额是否符合目标交易所要求
        if (new BigNumber(amount).lt(amountMin) || new BigNumber(amount).multipliedBy(targetPrice).lt(costMin)) {
          console.log(`不符合${targetName}最小挂单数量或最小挂单总额`);
          return;
        }

        // 检查目标交易所counter数量
        if (new BigNumber(amount).multipliedBy(targetPrice).gt(target_counter_free)) {
          console.log(`${targetName} ${counter}余额不足`);
          return;
        }

        // 检查weidex base数量
        if (new BigNumber(amount).lt(weidex_base_free)) {
          console.log(`${weidexName} ${base}余额不足`);
          return;
        }

        await targetExchange.createOrder(pair, "limit", "buy", amount, targetPrice);
        await weidexExchange.createOrder(pair, "sell", amount, new BigNumber(weidexPrice).multipliedBy(0.999).toNumber());
      }
    } catch (error) {
      console.log(error);
    } finally {
      console.log(`------${pair}套利结束------\n`);
    }
  };

  return {
    run
  };
};

module.exports = ArbitrageFactory;
