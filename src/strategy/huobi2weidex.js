const assert = require("assert");
const program = require("commander");
const Huobipro = require("ccxt").huobipro;
const Weidex = require("../js/weidex");
const MappingFactory = require("./factory/mapping");
const loadConfig = require("./utils/loadConfig");

program
  .description("mapping order from huobi to weidex")
  .option("-s, --scaling <number>", "mapping scaling, positive integer")
  .option("-l, --amountLimit <number>", "max amount limit when mapping", 10)
  .option("-c, --cancel", "whether cancel all orders before mapping", false)
  .option("-p, --period <number>", "run period", 10 * 60)
  .option("-f, --file <path>", "config file")
  .parse(process.argv);

const scaling = Number(program.scaling);
const amountLimit = Number(program.amountLimit);
const period = Number(program.period);
const cancel = program.cancel;

assert(Number.isInteger(scaling) && scaling > 0, "scaling need be positive integer.");
assert(!Number.isNaN(amountLimit) && amountLimit > 0, "amountLimit need be positive.");

let config;

try {
  config = loadConfig(program.file);
} catch (error) {
  console.log(error);
  process.exit(0);
}

const weidex = new Weidex({
  address: config.jingtumHuobi.address,
  secret: config.jingtumHuobi.secret,
  enableRateLimit: true
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

const mapping = MappingFactory(huobipro, weidex, { scaling, amountLimit, cancel });

mapping.run(config.tradePairs);
setInterval(mapping.run, period * 1000, config.tradePairs);
