const fs = require("fs");
const path = require("path");
const readline = require("readline");
const tinydate = require("tinydate");
const program = require("commander");
const axios = require("axios");
const constant = require("./constant");
const { getPath } = require("../util");

const service = axios.create({
  timeout: 30000,
  baseURL: "https://www.okex.com"
});

service.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    return Promise.reject(error);
  }
);

program
  .description("fetch kline data of okex")
  .requiredOption("-p, --period <string>", "value of period is one of '1min', '3min', '5min', '15min', '30min', '1hour', '2hour', '4hour', '6hour', '1day' and 1'week'")
  .requiredOption("-s, --symbol <string>", "symbol likes 'btc-usdt'")
  .parse(process.argv);

const { period, symbol } = program;
if (!constant.periodRegx.test(period)) {
  console.log("value of period is one of '1min', '3min', '5min', '15min', '30min', '1hour', '2hour', '4hour', '6hour', '1day' and 1'week'.");
  process.exit(0);
}
if (!constant.symbolRegx.test(symbol)) {
  console.log("value of symbol is invalid, symbol likes 'btc-usdt'.");
  process.exit(0);
}

const file = path.join(__dirname, `./periods/${symbol}/${period}`);

if (!fs.existsSync(file)) {
  console.log(`${file} is not exist, please run 'generate-period.js' firstly.`);
  process.exit(0);
}

const symbolFolder = path.join(__dirname, "kline-data", symbol);
if (!fs.existsSync(symbolFolder)) {
  fs.mkdirSync(symbolFolder);
}

const periodFolder = path.join(symbolFolder, period);
if (!fs.existsSync(periodFolder)) {
  fs.mkdirSync(periodFolder);
}

let num = 0;

const rl = readline.createInterface({
  input: fs.createReadStream(file),
  output: process.stdout,
  terminal: false
});

rl.on("line", (line) => {
  try {
    const data = JSON.parse(line);
    const file = getPath(Object.assign(data, { folder: periodFolder }));
    if (!fs.existsSync(file)) {
      num = num + 1;
      setTimeout(() => {
        fetchKline(data);
      }, num * 200);
    }
  } catch (error) {
    console.log(error);
  }
});

const fetchKline = async (data) => {
  try {
    const { start, end, granularity } = data;
    const id = data.instrument_id;
    const res = await service({
      url: `/api/spot/v3/instruments/${id}/candles`,
      params: {
        granularity,
        start,
        end
      },
      method: "get"
    });
    if (Array.isArray(res) && res.length > 0) {
      const lastTime = res[0][0];
      const firstTime = res[res.length - 1][0];
      console.log("first date:", tinydate("{YYYY}.{MM}.{DD} {HH}:{mm}")(new Date(firstTime)));
      console.log("last date: ", tinydate("{YYYY}.{MM}.{DD} {HH}:{mm}")(new Date(lastTime)));
    }
    fs.writeFileSync(getPath(Object.assign(data, { folder: periodFolder })), JSON.stringify(res, null, 2));
  } catch (error) {
    console.log(error);
  }
};
