"use strict";

const log = require("ololog").configure({ locate: false });
const ccxt = require("../../ccxt");
const Configs = require("./config");
const weidex = new ccxt["weidex"]({
  address: Configs.jingtumHuobi.address,
  secret: Configs.jingtumHuobi.secret,
  enableRateLimit: true
});

async function test() {
  const configs = await weidex.fetch(Configs.weidexConfig.jc_config);
  console.log(configs);
  weidex.configs = configs;

  const coinpairConfigs = await weidex.fetch(Configs.weidexConfig.coins_pairs_config);
  console.log(coinpairConfigs);
  weidex.coinpairConfigs = coinpairConfigs;
  log(await weidex.fetchMarkets("SWT-CNY", "normal"));

  // get balance
  log(await weidex.fetchBalance());
  // get order book
  log(await weidex.fetchOrders());

  log(await weidex.createOrder("", "buy", "1"));

  process.exit();
}

test();
