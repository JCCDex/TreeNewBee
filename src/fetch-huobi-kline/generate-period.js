const fs = require("fs");
const path = require("path");
const program = require("commander");
const constant = require("./constant");
program
  .usage("[options]")
  .requiredOption("-p, --period <kline period>", "value of period is one of '1min', '5min', '15min', '30min', '60min', '4hour', '1day', '1mon', '1week' and '1year'")
  .requiredOption("-s, --symbol <symbol>", "symbol like 'btcusdt'")
  .parse(process.argv);

const generateWithInterval = (period, symbol, interval) => {
  // 2017-07-28.01:00:00
  let from = 1501174800;

  let now = Math.floor(new Date().getTime() / 1000);

  // 火币最多返回300条数据，时间间隔设置为299 * interval
  let sum = 299 * interval;
  const req = `market.${symbol}.kline.${period}`;
  if (!constant.reqRegx.test(req)) {
    console.error("req is invalid");
    process.exit(0);
  }

  const symbolFolder = path.join(__dirname, "periods", symbol);
  if (!fs.existsSync(symbolFolder)) {
    fs.mkdirSync(symbolFolder);
  }

  while (now - from > sum) {
    const to = from + sum;
    try {
      const data = {
        from,
        to,
        id: `${from}/${to}`,
        req
      };
      fs.appendFileSync(path.join(symbolFolder, period), JSON.stringify(data) + "\n");
      from = to;
    } catch (error) {
      console.log(error);
      process.exit(0);
    }
  }

  if (from < now) {
    try {
      const data = {
        from,
        to: now,
        id: `${from}/${now}`,
        req
      };
      fs.appendFileSync(path.join(symbolFolder, period), JSON.stringify(data) + "\n");
    } catch (error) {
      console.log(error);
      process.exit(0);
    }
  }
};

const generateWithoutInterval = (period, symbol) => {
  // 2017-07-28.01:00:00
  let from = 1501174800;

  let now = Math.floor(new Date().getTime() / 1000);
  const req = `market.${symbol}.kline.${period}`;

  if (!constant.reqRegx.test(req)) {
    console.error("req is invalid");
    process.exit(0);
  }

  const symbolFolder = path.join(__dirname, "periods", symbol);
  if (!fs.existsSync(symbolFolder)) {
    fs.mkdirSync(symbolFolder);
  }

  try {
    const data = {
      id: `${from}/${now}`,
      req
    };
    fs.appendFileSync(path.join(symbolFolder, period), JSON.stringify(data) + "\n");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

const generate = () => {
  const { period, symbol } = program;
  if (!constant.periodRegx.test(period)) {
    console.error("value of period must be one of '1min', '5min', '15min', '30min', '60min', '4hour', '1day', '1mon', '1week' and '1year'");
    process.exit(0);
  }
  if (!constant.symbolRegx.test(symbol)) {
    console.log("value of symbol is invalid");
    process.exit(0);
  }
  switch (period) {
    case "1min":
      generateWithInterval(period, symbol, 60);
      break;
    case "5min":
      generateWithInterval(period, symbol, 5 * 60);
      break;
    case "15min":
      generateWithInterval(period, symbol, 15 * 60);
      break;
    case "30min":
      generateWithInterval(period, symbol, 30 * 60);
      break;
    case "60min":
      generateWithInterval(period, symbol, 60 * 60);
      break;
    case "4hour":
      generateWithInterval(period, symbol, 4 * 60 * 60);
      break;
    case "1day":
      generateWithInterval(period, symbol, 24 * 60 * 60);
      break;
    case "1mon":
    case "1week":
    case "1year":
      generateWithoutInterval(period, symbol);
      break;
    default:
      break;
  }
};

generate();
