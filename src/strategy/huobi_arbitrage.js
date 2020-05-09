"use strict";
const program = require("commander");
const updateWeidexHosts = require("./utils/updateWeidexHosts");
const loadConfig = require("./utils/loadConfig");
const Huobipro = require("ccxt").huobipro;
const Weidex = require("../js/weidex");
const ArbitrageFactory = require("./factory/arbitrage");

program
  .description("arbitrage between huobi and weidex")
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

const arbitrage = ArbitrageFactory(huobipro, weidex, config.arbitrageProfit);
arbitrage.run(config.tradePairs);
setInterval(arbitrage.run, Number(period) * 1000, config.tradePairs);
