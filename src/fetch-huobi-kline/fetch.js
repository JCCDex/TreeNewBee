const WebSocket = require("ws");
const fs = require("fs");
const pako = require("pako");
const path = require("path");
const readline = require("readline");
const tinydate = require("tinydate");
const ws = new WebSocket("wss://api.huobi.pro/ws");
const program = require("commander");
const constant = require("./constant");

program
  .usage("[options]")
  .requiredOption("-p, --period <kline period>", "value of period is one of '1min', '5min', '15min', '30min', '60min', '4hour', '1day', '1mon', '1week' and '1year'")
  .requiredOption("-s, --symbol <symbol>", "symbol like 'btcusdt'")
  .parse(process.argv);

const { period, symbol } = program;
if (!constant.periodRegx.test(period)) {
  console.error("value of period must be one of '1min', '5min', '15min', '30min', '60min', '4hour', '1day', '1mon', '1week' and '1year'");
  process.exit(0);
}
if (!constant.symbolRegx.test(symbol)) {
  console.log("value of symbol is invalid");
  process.exit(0);
}

const file = `./periods/${symbol}/${period}`;

if (!fs.existsSync(file)) {
  console.error(`${file} is not exist, please run 'generate-period.js' firstly.`);
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

let rl;
let num = 0;

ws.on("open", () => {
  rl = readline.createInterface({
    input: fs.createReadStream(file),
    output: process.stdout,
    terminal: false
  });

  rl.on("line", (line) => {
    try {
      const data = JSON.parse(line);
      const file = getPath(data);
      if (!fs.existsSync(file)) {
        num = num + 1;
        setTimeout(() => {
          ws.send(line);
        }, num * 100);
      }
    } catch (error) {
      console.log(error);
    }
  });
});

ws.on("message", (blob) => {
  handleMessage(blob);
});

const getPath = (data) => {
  const { id, req } = data;
  const ids = id.split("/");
  let from = Number(ids[0]) * 1000;
  let to = Number(ids[1]) * 1000;
  let format;
  if (/[0-9]+min/.test(req)) {
    format = "{YYYY}.{MM}.{DD}:{HH}:{mm}";
  } else if (/[0-9]+hour/.test(req)) {
    format = "{YYYY}.{MM}.{DD}:{HH}";
  } else if (/[0-9]+day/.test(req)) {
    format = "{YYYY}.{MM}.{DD}";
  } else if (/[0-9]+week/.test(req)) {
    format = "{YYYY}.{MM}.{DD}";
  } else if (/[0-9]+mon/.test(req)) {
    format = "{YYYY}.{MM}";
  } else if (/[0-9]+year/.test(req)) {
    format = "{YYYY}";
  }
  const filename = tinydate(format)(new Date(from)) + "-" + tinydate(format)(new Date(to));
  return path.join(periodFolder, filename);
};

function sendHeartMessage(ping) {
  ws.send(JSON.stringify({ pong: ping }));
}

const handleMessage = (blob) => {
  try {
    const result = JSON.parse(pako.inflate(blob, { to: "string" }));
    if (result.ping) {
      console.log("ping");
      return sendHeartMessage(result.ping);
    }

    const { status, rep, id, data } = result;
    if (status !== "ok") {
      console.log(result["err-msg"]);
      return;
    }

    if (constant.klineTopicRegx.test(rep)) {
      const ids = id.split("/");
      const from = Number(ids[0]);
      const to = Number(ids[1]);
      let filterData;
      if (/[0-9]+[week|mon|year]/.test(rep)) {
        filterData = data;
      } else {
        filterData = data.filter((d) => d.id >= from && d.id <= to);
      }
      if (Array.isArray(filterData) && filterData.length > 0) {
        const firstTime = filterData[0].id;
        const lastTime = filterData[filterData.length - 1].id;
        console.log("first date:", tinydate("{YYYY}.{MM}.{DD} {HH}:{mm}")(new Date(firstTime * 1000)));
        console.log("last date: ", tinydate("{YYYY}.{MM}.{DD} {HH}:{mm}")(new Date(lastTime * 1000)));
      }
      fs.writeFileSync(getPath({ req: rep, id }), JSON.stringify(filterData, null, 2));
    }
  } catch (err) {
    console.log(err);
    process.exit(1);
  }
};
