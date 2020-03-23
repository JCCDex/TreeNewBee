"use strict";
const program = require("commander");
const loadConfig = require("./utils/loadConfig");
const ccxt = require("ccxt");
const Weidex = require("../js/weidex");
const ArbitrageFactory = require("./factory/arbitrage");

program
  .description("arbitrage between okex and weidex")
  .option("-p, --period <number>", "run period", 30)
  .option("-f, --file <path>", "config file")
  .parse(process.argv);

const { period, file } = program;

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
  enableRateLimit: true
});

const okex3 = new ccxt.okex3({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

const arbitrage = ArbitrageFactory(okex3, weidex, config.arbitrageProfit);
arbitrage.run(config.tradePairs);
setInterval(arbitrage.run, Number(period) * 1000, config.tradePairs);
