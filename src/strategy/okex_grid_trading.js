const program = require("commander");
const loadConfig = require("./utils/loadConfig");
const ccxt = require("ccxt");
const GridTradingFactory = require("./factory/grid_trading");

program
  .description("okex grid trading")
  .option("-p, --pair <string>", "pair name, likes 'btc/usdt'")
  .option("-H, --highAmount <number>", "amount ceiling")
  .option("-L, --lowAmount <number>", "amount floor")
  .option("-h, --highPrice <number>", "price ceiling")
  .option("-l, --lowPrice <number>", "price floor")
  .option("-q, --quantity <number>", "trading quantity")
  .option("-t, --type <string>", "trading type, should be 'buy' or 'sell'")
  .option("-f, --file <path>", "config file")
  .parse(process.argv);

const { pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type, file } = program;

let config;

try {
  config = loadConfig(file);
} catch (error) {
  console.log(error);
  process.exit(0);
}

const okex3 = new ccxt.okex3({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

const gridTrading = GridTradingFactory(okex3);

gridTrading.startTrading({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type });
