"use strict";
const program = require("commander");
const loadConfig = require("./utils/loadConfig");
const updateWeidexHosts = require("./utils/updateWeidexHosts");
const Okex3 = require("ccxt").okex3;
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
  enableRateLimit: true,
  timeout: 30000
});

const okex3 = new Okex3({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

updateWeidexHosts.init(weidex);

const arbitrage = ArbitrageFactory(okex3, weidex, config.arbitrageProfit);
arbitrage.run(config.tradePairs);
setInterval(arbitrage.run, Number(period) * 1000, config.tradePairs);
