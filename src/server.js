const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 9099 });

const { exec, execSync } = require("child_process");

wss.on("connection", function connection(ws) {
  ws.on("message", (message) => {
    console.log(message);
    try {
      message = JSON.parse(message);
      const { method, exchange } = message;
      if (method === "autoGridTrading") {
        const { pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type, buyProfit, sellProfit, timer } = message;
        if (exchange === "weidex") {
          try {
            const pid = execSync(`forever list | grep weidex_auto_grid_trading.js | grep ${pair} | awk '{print $(NF-2)}'`);
            execSync(`forever stop ${pid.toString()}`);
          } catch (error) {}

          exec(`forever start ./strategy/weidex_auto_grid_trading.js -p ${pair} -H ${highAmount} -L ${lowAmount} -h ${highPrice} -l ${lowPrice} -q ${quantity} -t ${type} -f ./strategy/jccdexConfig.json -SP ${sellProfit} -BP ${buyProfit} -T ${timer * 60 * 1000}`, (error, stdout, stderr) => {
            if (error) {
              ws.send(JSON.stringify({ method, success: false }));
              return;
            }
            ws.send(JSON.stringify({ method, success: true }));
          });
        }
      } else if (method === "arbitrage") {
        const { pair, arbitrageProfit, period } = message;
        if (exchange === "huobi") {
          try {
            // 停止已存在交易对的pid
            const pid = execSync(`forever list | grep huobi_arbitrage.js | grep ${pair} | awk '{print $(NF-2)}'`);
            execSync(`forever stop ${pid.toString()}`);
          } catch (error) {}
          exec(`forever start ./strategy/huobi_arbitrage.js -p ${pair} -f ./strategy/jccdexConfig.json -a ${arbitrageProfit} -P ${period * 60 * 1000}`, (error, stdout, stderr) => {
            if (error) {
              ws.send(JSON.stringify({ method, success: false }));
              return;
            }
            ws.send(JSON.stringify({ method, success: true }));
          });
        }
      } else if (method === "stopArbitrage") {
        const { pair } = message;
        if (exchange === "huobi") {
          try {
            // 停止已存在交易对的pid
            const pid = execSync(`forever list | grep huobi_arbitrage.js | grep ${pair} | awk '{print $(NF-2)}'`);
            execSync(`forever stop ${pid.toString()}`);
          } catch (error) {}
          ws.send(JSON.stringify({ method, success: true }));
        }
      } else if (method === "stopAutoGridTrading") {
        const { pair } = message;
        if (exchange === "weidex") {
          try {
            // 停止已存在交易对的pid
            const pid = execSync(`forever list | grep weidex_auto_grid_trading.js | grep ${pair} | awk '{print $(NF-2)}'`);
            execSync(`forever stop ${pid.toString()}`);
          } catch (error) {}
          ws.send(JSON.stringify({ method, success: true }));
        }
      }
    } catch (error) {}
  });
});
