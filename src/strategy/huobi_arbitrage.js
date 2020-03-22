"use strict";
const ccxt = require("../ccxt");
const config = require("./config");
const ArbitrageFactory = require("./arbitrage");

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

const arbitrage = ArbitrageFactory(huobipro, weidex);
arbitrage.run();
setInterval(arbitrage.run, 30000);
