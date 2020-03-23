const assert = require("assert");
const program = require("commander");
const Okex3 = require("ccxt").okex3;
const Weidex = require("../js/weidex");
const MappingFactory = require("./factory/mapping");
const loadConfig = require("./utils/loadConfig");

program
  .description("mapping order from okex to weidex")
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
  address: config.jingtumOkex.address,
  secret: config.jingtumOkex.secret,
  enableRateLimit: true
});

const okex3 = new Okex3({
  apiKey: config.okex.access_key,
  secret: config.okex.secretkey,
  verbose: false,
  timeout: 60000,
  enableRateLimit: true,
  password: config.okex.privatekey
});

const mapping = MappingFactory(okex3, weidex, { scaling, amountLimit, cancel });

mapping.run(config.tradePairs);
setInterval(mapping.run, period * 1000, config.tradePairs);