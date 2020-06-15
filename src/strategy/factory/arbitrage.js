const BigNumber = require("bignumber.js");

// bids买单，asks卖单
const ArbitrageFactory = (fromExchange, toExchange, arbitrageProfit) => {
  const fromName = fromExchange.name;
  const toName = toExchange.name;
  const profit = arbitrageProfit;

  const startArbitrage = async (pair) => {
    console.log(`------${pair}套利开始------`);
    try {
      const [fromMarketsInfo, toMarketsInfo] = await Promise.all([fromExchange.loadMarkets(), toExchange.loadMarkets()]);
      const fromLimits = fromMarketsInfo[pair].limits;
      const fromCostMin = fromLimits.cost.min || 0;
      const fromAmountMin = fromLimits.amount.min || 0;
      const toLimits = toMarketsInfo[pair].limits;
      const toCostMin = toLimits.cost.min || 0;
      const toAmountMin = toLimits.amount.min || 0;
      console.log(`${toName} cost min: `, toCostMin);
      console.log(`${toName} amount min: `, toAmountMin);
      console.log(`${fromName} cost min: `, fromCostMin);
      console.log(`${fromName} amount min: `, fromAmountMin);

      const [fromBalance, toBalance] = await Promise.all([fromExchange.fetchBalance(), toExchange.fetchBalance()]);
      const [base, counter] = pair.split("/");
      if (!fromBalance[base]) {
        console.log(`${fromName} ${base} token不存在`);
        process.exit(0);
      }
      if (!fromBalance[counter]) {
        console.log(`${fromName} ${counter} token不存在`);
        process.exit(0);
      }
      const from_base_free = fromBalance[base].free;
      const from_counter_free = fromBalance[counter].free;
      const to_base_free = toBalance[base].free;
      const to_counter_free = toBalance[counter].free;

      console.log(`${fromName} ${base}可用余额: `, from_base_free);
      console.log(`${fromName} ${counter}可用余额: `, from_counter_free);
      console.log(`${toName} ${base}可用余额: `, to_base_free);
      console.log(`${toName} ${counter}可用余额: `, to_counter_free);

      const markets = await Promise.all([fromExchange.fetchOrderBook(pair), toExchange.fetchOrderBook(pair)]);
      const [fromMarkets, toMarkets] = markets;

      // from买一单(最高价)
      const maxFromBid = fromMarkets.bids[0];
      // from卖一单(最低价)
      const minFromAsk = fromMarkets.asks[0];

      console.log(`${fromName} ${pair}最高价买单：`, maxFromBid);
      console.log(`${fromName} ${pair}最低价卖单：`, minFromAsk);

      const matchToAsks = toMarkets.asks.filter((ask) => {
        return new BigNumber(maxFromBid[0])
          .div(ask[0])
          .minus(1)
          .isGreaterThanOrEqualTo(profit);
      });

      const matchToBids = toMarkets.bids.filter((bid) => {
        return new BigNumber(bid[0])
          .div(minFromAsk[0])
          .minus(1)
          .isGreaterThanOrEqualTo(profit);
      });

      console.log("matchToAsks: ", matchToAsks);
      console.log("matchToBids: ", matchToBids);

      // weidex买, 目标交易所卖
      if (matchToAsks.length > 0) {
        // 以huobi上XRP/USDT为例
        // weidex上用usdt买xrp, huobi上卖xrp
        console.log(`${toName}买, ${fromName}卖`);
        const toPrice = matchToAsks[matchToAsks.length - 1][0];
        const toAmount = matchToAsks.map((ask) => ask[1]).reduce((total, amount) => new BigNumber(total).plus(amount).toNumber());
        console.log("to price:", toPrice);
        console.log("to match total amount:", toAmount);
        const [fromPrice, fromAmount] = maxFromBid;
        let amount = new BigNumber(toAmount);
        amount = amount.gt(fromAmount) ? new BigNumber(fromAmount) : amount;
        amount = amount.gt(from_base_free) ? new BigNumber(from_base_free) : amount;

        // 检查weidex counter数量
        if (
          amount
            .multipliedBy(toPrice)
            .multipliedBy(1.001)
            .gt(to_counter_free)
        ) {
          amount = new BigNumber(to_counter_free).div(toPrice).div(1.001);
        }

        // 检查挂单数量和总额是否符合目标交易所要求
        if (amount.lt(fromAmountMin) || amount.multipliedBy(fromPrice).lt(fromCostMin)) {
          console.log(`不符合${fromName}最小挂单数量或最小挂单总额`);
          return;
        }

        // 检查挂单数量和总额是否符合目标交易所要求
        if (amount.lt(toAmountMin) || amount.multipliedBy(toPrice).lt(toCostMin)) {
          console.log(`不符合${toName}最小挂单数量或最小挂单总额`);
          return;
        }
        console.log("amount: ", amount.toString());

        await fromExchange.createOrder(pair, "limit", "sell", amount.toNumber(), fromPrice);
        await toExchange.createOrder(pair, "limit", "buy", amount.toNumber(), new BigNumber(toPrice).multipliedBy(1.001).toNumber());
      }
      // weidex卖, 目标交易所买
      else if (matchToBids.length > 0) {
        // 以huobi上XRP/USDT为例
        // huobi上用usdt买xrp, weidex上卖xrp
        console.log(`${toName}卖, ${fromName}买`);
        const toPrice = matchToBids[matchToBids.length - 1][0];
        const toAmount = matchToBids.map((bid) => bid[1]).reduce((total, amount) => new BigNumber(total).plus(amount).toNumber());
        console.log("weidex price:", toPrice);
        console.log("weidex match total amount:", toAmount);
        const [fromPrice, fromAmount] = minFromAsk;
        let amount = new BigNumber(toAmount);
        amount = amount.gt(fromAmount) ? new BigNumber(fromAmount) : amount;
        amount = amount.gt(to_base_free) ? new BigNumber(to_base_free) : amount;
        // 检查目标交易所counter数量
        if (amount.multipliedBy(fromPrice).gt(from_counter_free)) {
          amount = new BigNumber(from_counter_free).div(fromPrice);
        }
        // 检查挂单数量和总额是否符合目标交易所要求
        if (amount.lt(fromAmountMin) || amount.multipliedBy(fromPrice).lt(fromCostMin)) {
          console.log(`不符合${fromName}最小挂单数量或最小挂单总额`);
          return;
        }

        // 检查挂单数量和总额是否符合目标交易所要求
        if (amount.lt(toAmountMin) || amount.multipliedBy(toPrice).lt(toCostMin)) {
          console.log(`不符合${toName}最小挂单数量或最小挂单总额`);
          return;
        }

        console.log("amount: ", amount.toString());

        await fromExchange.createOrder(pair, "limit", "buy", amount.toNumber(), fromPrice);
        await toExchange.createOrder(pair, "limit", "sell", amount.toNumber(), new BigNumber(toPrice).multipliedBy(0.999).toNumber());
      }
    } catch (error) {
      console.log(error);
    } finally {
      console.log(`------${pair}套利结束------\n`);
    }
  };

  return {
    startArbitrage
  };
};

module.exports = ArbitrageFactory;
