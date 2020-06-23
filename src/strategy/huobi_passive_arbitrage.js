"use strict";
const program = require("commander");
const updateWeidexHosts = require("./utils/updateWeidexHosts");
const loadConfig = require("./utils/loadConfig");
const Huobipro = require("ccxt").huobipro;
const Weidex = require("../js/weidex");
const fs = require("fs");
const path = require("path");
const sleep = require("sleep");
const { default: BigNumber } = require("bignumber.js");

program
  .description("passive arbitrage between huobi and weidex")
  .requiredOption("-p, --pair <number>", "交易对")
  .option("-P, --period <number>", "run period", 30)
  .option("-f, --file <path>", "config file")
  .option("-A, --amount <path>", "amount", 0.05)
  .parse(process.argv);

const { file, amount, period } = program;
const pair = program.pair.toUpperCase();
let config;

try {
  config = loadConfig(file);
} catch (error) {
  console.log(error);
  process.exit(0);
}

const weidex = new Weidex({
  address: config.jingtumArbitrage.address,
  secret: config.jingtumArbitrage.secret,
  enableRateLimit: true,
  timeout: 30000
});

const huobipro = new Huobipro({
  apiKey: config.huobi.access_key,
  secret: config.huobi.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  urls: {
    api: {
      market: config.huobi.market,
      public: config.huobi.public,
      private: config.huobi.private,
      zendesk: config.huobi.zendesk
    }
  },
  hostname: config.huobi.hostname
});

updateWeidexHosts.init(weidex);

const getUSDTBalance = async () => {
  const weidexBalance = await weidex.fetchBalance();
  const counter = pair.split("/")[1];
  const counterTotal = weidexBalance[counter].total;
  let usdtAmount;
  try {
    usdtAmount = fs.readFileSync(path.join(__dirname, "usdt_balance"), "utf-8");
  } catch (error) {
    usdtAmount = counterTotal;
    fs.writeFileSync(path.join(__dirname, "usdt_balance"), usdtAmount);
  }
  return [usdtAmount, counterTotal];
};

const getEthBalance = async () => {
  const weidexBalance = await weidex.fetchBalance();
  const base = pair.split("/")[0];
  const baseTotal = weidexBalance[base].total;
  let ethAmount;
  try {
    ethAmount = fs.readFileSync(path.join(__dirname, "eth_balance"), "utf-8");
  } catch (error) {
    ethAmount = baseTotal;
    fs.writeFileSync(path.join(__dirname, "eth_balance"), ethAmount);
  }
  return [ethAmount, baseTotal];
};

const ethusdtArbitrage = async () => {
  try {
    console.log("------eth->usdt passive arbitrage start------");
    const usdtBalance = await getUSDTBalance();
    const [pre, now] = usdtBalance;
    console.log("pre usdt amount: ", pre);
    console.log("now usdt amount: ", now);
    const orders = await weidex.fetchOpenOrders(pair.toUpperCase(), 0, 2);

    if (new BigNumber(now).gt(pre) && orders.length === 0) {
      let price = fs.readFileSync(path.join(__dirname, "eth-usdt-order"), "utf-8");
      price = new BigNumber(price).div(1.01).toString();
      console.log("usdt raise: ", new BigNumber(now).minus(pre).toString());
      if (new BigNumber(now).minus(pre).gt(5)) {
        console.log("start create an order in huobi, price is: ", price);
        await huobipro.createOrder(pair, "limit", "buy", amount, price);
        fs.writeFileSync(path.join(__dirname, "usdt_balance"), now);
      } else {
        console.log("not start create an order in huobi");
      }
    }

    const market = await huobipro.fetchOrderBook(pair);

    const minAsk = market.asks[0];
    const minAskPrice = minAsk[0];

    if (orders.length > 0) {
      const order = orders[0];
      if (new BigNumber(order.price).div(minAskPrice).lt(1.01)) {
        console.log("cancel weidex order firstly");
        await weidex.cancelOrder(order.id);
        sleep.msleep(500);
        const price = new BigNumber(minAskPrice).times(1.01).toString();
        console.log("cancel weidex order success");
        console.log("create a weidex order, price is: ", price);
        await weidex.createOrder(pair, "limit", "sell", amount, price);
        fs.writeFileSync(path.join(__dirname, "eth-usdt-order"), price);
      } else {
        console.log("order's length is more than 0, but don't need cancel");
      }
    } else {
      const price = new BigNumber(minAskPrice).times(1.01).toString();
      console.log("create a weidex order, price is: ", price);
      await weidex.createOrder(pair, "limit", "sell", amount, price);
      fs.writeFileSync(path.join(__dirname, "eth-usdt-order"), price);
    }
  } catch (error) {
    console.log("error: ", error.message);
  } finally {
    console.log("------eth->usdt passive arbitrage end------\n\n");
  }
};

const usdtethArbitrage = async () => {
  try {
    console.log("------usdt->eth passive arbitrage start------");
    const ethBalance = await getEthBalance();
    const [pre, now] = ethBalance;
    console.log("pre eth amount: ", pre);
    console.log("now eth amount: ", now);
    const orders = await weidex.fetchOpenOrders(pair.toUpperCase(), 0, 1);

    if (new BigNumber(now).gt(pre) && orders.length === 0) {
      let price = fs.readFileSync(path.join(__dirname, "usdt-eth-order"), "utf-8");
      price = new BigNumber(price).times(1.01).toString();
      console.log("eth raise: ", new BigNumber(now).minus(pre).toString());
      if (new BigNumber(now).minus(pre).gt(0.04)) {
        console.log("start create an order in huobi, price is: ", price);
        await huobipro.createOrder(pair, "limit", "sell", amount, price);
        fs.writeFileSync(path.join(__dirname, "eth_balance"), now);
      } else {
        console.log("not start create an order in huobi");
      }
    }

    const market = await huobipro.fetchOrderBook(pair);

    const maxBid = market.bids[0];
    const maxBidPrice = maxBid[0];

    if (orders.length > 0) {
      const order = orders[0];
      if (new BigNumber(maxBidPrice).div(order.price).lt(1.01)) {
        console.log("cancel weidex order firstly");
        await weidex.cancelOrder(order.id);
        sleep.msleep(500);
        const price = new BigNumber(maxBidPrice).times(0.99).toString();
        console.log("cancel weidex order success");
        console.log("create a weidex order, price is: ", price);
        await weidex.createOrder(pair, "limit", "buy", amount, price);
        fs.writeFileSync(path.join(__dirname, "usdt-eth-order"), price);
      } else {
        console.log("order's length is more than 0, but don't need cancel");
      }
    } else {
      const price = new BigNumber(maxBidPrice).times(0.99).toString();
      console.log("create a weidex order, price is: ", price);
      await weidex.createOrder(pair, "limit", "buy", amount, price);
      fs.writeFileSync(path.join(__dirname, "usdt-eth-order"), price);
    }
  } catch (error) {
    console.log("error: ", error.message);
  } finally {
    console.log("------usdt->eth passive arbitrage end------\n\n");
  }
};

// 被动套利
const passiveArbitrage = async () => {
  await ethusdtArbitrage();
  sleep.sleep(30);
  await usdtethArbitrage();
};

passiveArbitrage();
setInterval(passiveArbitrage, period * 60 * 1000);
