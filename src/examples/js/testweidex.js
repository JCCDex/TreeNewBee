'use strict';

const log = require('ololog').configure({ locate: false })
const ccxt = require('../../ccxt')
const Configs = require('./testconfig')
const weidex = new ccxt['weidex']({
  address: Configs.jingtum1.address,
  secret: Configs.jingtum1.secret,
  enableRateLimit: true,
})


async function test() {
  const configs = await weidex.fetch(Configs.weidexConfig.jc_config)
  console.log(configs);
  weidex.configs = configs

  const coinpairConfigs = await weidex.fetch(Configs.weidexConfig.coins_pairs_config)
  console.log(coinpairConfigs);
  weidex.coinpairConfigs = coinpairConfigs
  //     const localStartTime = Date.now ()
  //     const { serverTime } = await weidex.publicGetTime ()
  //     const localFinishTime = Date.now ()
  //     const estimatedLandingTime = (localFinishTime + localStartTime) / 2

  //     const diff = serverTime - estimatedLandingTime

  //     log (`request departure time:     ${weidex.iso8601 (localStartTime)}`)
  //     log (`response arrival time:      ${weidex.iso8601 (localFinishTime)}`)
  //     log (`server time:                ${weidex.iso8601 (serverTime)}`)
  //     log (`request landing time (est): ${weidex.iso8601 (estimatedLandingTime)}, ${Math.abs (diff)} ms ${Math.sign (diff) > 0 ? 'behind' : 'ahead of'} server`)
  //     log ('\n')
  //    log(language)
  //     if (diff < -aheadWindow) {
  //         log.error.red (`your request will likely be rejected if local time is ahead of the server's time for more than ${aheadWindow} ms \n`)
  //     }

  log(await weidex.fetchMarkets("SWT-CNY", "normal"))

  // get balance
  log(await weidex.fetchBalance())
  // get order book
  log(await weidex.fetchOrders())




  log(await weidex.createOrder("", "buy", "1"))

  process.exit();

}

test();
