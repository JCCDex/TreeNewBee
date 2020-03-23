const program = require("commander");
const loadConfig = require("./loadConfig");
const ccxt = require("../ccxt");
const GridTradingFactory = require("./factory/grid_trading");

program
  .description("huobi grid trading")
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

const gridTrading = GridTradingFactory(huobipro);

gridTrading.startTrading({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type });
