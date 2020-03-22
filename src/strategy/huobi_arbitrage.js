"use strict";
const program = require("commander");
const ccxt = require("../ccxt");
const config = require("./config");
const ArbitrageFactory = require("./factory/arbitrage");

program
  .description("arbitrage between huobi and weidex")
  .option("-p, --period <number>", "run period", 30)
  .parse(process.argv);

const weidex = new ccxt["weidex"]({
  address: config.jingtumArbitrage.address,
  secret: config.jingtumArbitrage.secret,
  enableRateLimit: true
});

const huobipro = new ccxt["huobipro"]({
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

const { period } = program;

const arbitrage = ArbitrageFactory(huobipro, weidex);
arbitrage.run();
setInterval(arbitrage.run, Number(period) * 1000);
