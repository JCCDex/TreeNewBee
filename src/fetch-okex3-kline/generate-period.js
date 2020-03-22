const fs = require("fs");
const path = require("path");
const program = require("commander");
const constant = require("./constant");
program
  .usage("generate period file for fetching data of okex kline")
  .requiredOption("-p, --period <kline period>", "value of period is one of '1min', '3min', '5min', '15min', '30min', '1hour', '2hour', '4hour', '6hour', '1day' and 1'week'")
  .requiredOption("-s, --symbol <symbol>", "symbol likes 'btc-usdt'")
  .parse(process.argv);

const generateWithInterval = (period, symbol) => {
  // 2017-10-01
  let from = 1506787200000;

  let now = new Date().getTime();

  const interval = granularityMap.get(period);

  // okex最多返回200条数据，时间间隔设置为199 * interval
  let sum = 199 * interval * 1000; // ms

  const symbolFolder = path.join(__dirname, "periods", symbol);
  if (!fs.existsSync(symbolFolder)) {
    fs.mkdirSync(symbolFolder);
  }

  while (now - from > sum) {
    const to = from + sum;
    try {
      const data = {
        instrument_id: symbol,
        start: new Date(from).toISOString(),
        end: new Date(to).toISOString(),
        period,
        granularity: interval
      };
      fs.appendFileSync(path.join(symbolFolder, period), JSON.stringify(data) + "\n");
      from = to + interval * 1000;
    } catch (error) {
      console.log(error);
      process.exit(0);
    }
  }

  if (from < now) {
    try {
      const data = {
        instrument_id: symbol,
        start: new Date(from).toISOString(),
        end: new Date(now).toISOString(),
        period,
        granularity: interval
      };
      fs.appendFileSync(path.join(symbolFolder, period), JSON.stringify(data) + "\n");
    } catch (error) {
      console.log(error);
      process.exit(0);
    }
  }
};

const granularityMap = new Map([
  ["1min", 60],
  ["3min", 3 * 60],
  ["5min", 5 * 60],
  ["15min", 15 * 60],
  ["30min", 30 * 60],
  ["1hour", 60 * 60],
  ["2hour", 2 * 60 * 60],
  ["4hour", 4 * 60 * 60],
  ["6hour", 6 * 60 * 60],
  ["1day", 24 * 60 * 60],
  ["1week", 7 * 24 * 60 * 60]
]);

const generate = () => {
  const { period, symbol } = program;
  if (!constant.periodRegx.test(period)) {
    console.log("value of period is one of '1min', '3min', '5min', '15min', '30min', '1hour', '2hour', '4hour', '6hour', '1day' and 1'week'.");
    process.exit(0);
  }
  if (!constant.symbolRegx.test(symbol)) {
    console.log("value of symbol is invalid,symbol likes 'btc-usdt'.");
    process.exit(0);
  }

  generateWithInterval(period, symbol);
};

generate();
