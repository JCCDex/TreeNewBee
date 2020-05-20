const program = require("commander");
const loadConfig = require("./utils/loadConfig");
const Huobipro = require("ccxt").huobipro;
const AutoGridTradingFactory = require("./factory/auto_grid_trading");

program
  .description("huobi grid trading")
  .requiredOption("-p, --pair <string>", "pair name, likes 'btc/usdt'")
  .requiredOption("-H, --highAmount <number>", "amount ceiling")
  .requiredOption("-L, --lowAmount <number>", "amount floor")
  .requiredOption("-h, --highPrice <number>", "price ceiling")
  .requiredOption("-l, --lowPrice <number>", "price floor")
  .requiredOption("-q, --quantity <number>", "trading quantity")
  .requiredOption("-t, --type <string>", "trading type, should be 'buy' or 'sell'")
  .requiredOption("-f, --file <path>", "config file")
  .requiredOption("-SP, --sellProfit <path>", "卖出收益率")
  .requiredOption("-BP, --buyProfit <path>", "买进收益率")
  .requiredOption("-T, --timer <path>", "请求周期，单位ms", 60 * 1000)
  .parse(process.argv);

const { pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type, file, sellProfit, buyProfit, timer } = program;

let config;

try {
  config = loadConfig(file);
} catch (error) {
  console.log(error);
  process.exit(0);
}

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

const gridTrading = AutoGridTradingFactory(huobipro, { sellProfit, buyProfit }, timer);

gridTrading.startTrading({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type });
