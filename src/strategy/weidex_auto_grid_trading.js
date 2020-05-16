const program = require("commander");
const loadConfig = require("./utils/loadConfig");
const Weidex = require("../js/weidex");
const GridTradingFactory = require("./factory/grid_trading");
const updateWeidexHosts = require("./utils/updateWeidexHosts");
const BigNumber = require("bignumber.js");

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
  .requiredOption("-P, --profit <path>", "收益率")
  .requiredOption("-T, --timer <path>", "请求周期，单位ms", 60 * 1000)
  .parse(process.argv);

const { pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type, file, profit, timer } = program;

let config;

try {
  config = loadConfig(file);
} catch (error) {
  console.log(error);
  process.exit(0);
}

const weidex = new Weidex({
  address: config.jingtumHuobi.address,
  secret: config.jingtumHuobi.secret,
  enableRateLimit: true,
  timeout: 30000
});
updateWeidexHosts.init(weidex);

const gridTrading = GridTradingFactory(weidex);

const orderMap = new Map();

gridTrading
  .startTrading({ pair, highAmount, lowAmount, highPrice, lowPrice, quantity, type })
  .then((orders) => {
    if (orders.length > 0) {
      for (const order of orders) {
        orderMap.set(order.id, order);
      }
      console.log(orderMap);
      setInterval(watchOrders, timer);
    }
  })
  .catch((error) => {
    console.log(error);
  });

const watchOrders = async () => {
  try {
    const ids = Array.from(orderMap.keys());
    const orders = await weidex.fetchOrders();
    for (const id of ids) {
      try {
        const has = orders.some((order) => order.info.hash === id);
        if (!has) {
          console.log("id不存在：", id);
          const { pair, type, amount, price } = orderMap.get(id);
          const Type = type === "buy" ? "sell" : "buy";
          const Price = Type === "sell" ? new BigNumber(price).multipliedBy(new BigNumber(1).plus(profit)).toString() : new BigNumber(price).multipliedBy(new BigNumber(1).minus(profit)).toString();
          const res = await weidex.createOrder(pair, "limit", Type, amount, Price);
          console.log(price, Price);
          console.log("挂单成功：", res);
          orderMap.set(res.id, {
            id: res.id,
            pair,
            type: Type,
            amount,
            price: Price
          });
          orderMap.delete(id);
        } else {
          console.log("id存在：", id);
        }
      } catch (error) {
        console.log(error);
      }
    }
  } catch (error) {
    console.log(error);
  }
};
