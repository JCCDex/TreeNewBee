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
  log(await weidex.fetchMarkets("SWT-CNY", "normal"));

  // get balance
  log(await weidex.fetchBalance());
  // get order book
  log(await weidex.fetchOrders());

  process.exit();
}

test();
