"use strict";
const ccxt = require("../ccxt");
const config = require("./config");
const ArbitrageFactory = require("./arbitrage");

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

const arbitrage = ArbitrageFactory(okex3, weidex);
arbitrage.run();
setInterval(arbitrage.run, 30000);
