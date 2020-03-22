const program = require("commander");
const ccxt = require("../ccxt");
const config = require("./config");
const GridTradingFactory = require("./grid_trading");

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

program
  .description("huobi grid trading")
  .option("-p, --pair <string>", "pair name, likes 'btc/usdt'")
  .option("-H, --highAmount <number>", "amount ceiling")
  .option("-L, --lowAmount <number>", "amount floor")
  .option("-h, --highPrice <number>", "price ceiling")
  .option("-l, --lowPrice <number>", "price floor")
  .option("-q, --quantity <number>", "trading quantity")
  .option("-t, --type <string>", "trading type, should be 'buy' or 'sell'")
  .parse(process.argv);

const gridTrading = GridTradingFactory(huobipro);

const { pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type } = program;
gridTrading.startTrading({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type });
