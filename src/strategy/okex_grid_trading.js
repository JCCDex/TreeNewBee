const program = require("commander");
const ccxt = require("../ccxt");
const config = require("./config");
const GridTradingFactory = require("./grid_trading");

const okex3 = new ccxt["okex3"]({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

program
  .description("okex grid trading")
  .option("-p, --pair <string>", "pair name, likes 'btc/usdt'")
  .option("-H, --highAmount <number>", "amount ceiling")
  .option("-L, --lowAmount <number>", "amount floor")
  .option("-h, --highPrice <number>", "price ceiling")
  .option("-l, --lowPrice <number>", "price floor")
  .option("-q, --quantity <number>", "trading quantity")
  .option("-t, --type <string>", "trading type, should be 'buy' or 'sell'")
  .parse(process.argv);

const gridTrading = GridTradingFactory(okex3);

const { pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type } = program;
gridTrading.startTrading({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type });
