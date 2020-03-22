"use strict";
const program = require("commander");
const ccxt = require("../ccxt");
const config = require("./config");
const ArbitrageFactory = require("./factory/arbitrage");

program
  .description("arbitrage between okex and weidex")
  .option("-p, --period <number>", "run period", 30)
  .parse(process.argv);

const weidex = new ccxt["weidex"]({
  address: config.jingtumArbitrage.address,
  secret: config.jingtumArbitrage.secret,
  enableRateLimit: true
});

const okex3 = new ccxt["okex3"]({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

const { period } = program;

const arbitrage = ArbitrageFactory(okex3, weidex);
arbitrage.run();
setInterval(arbitrage.run, Number(period) * 1000);
