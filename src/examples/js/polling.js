const { SubscribeFactory, ConfigFactory, JcConfig } = require("jcc_rpc");
const fetch = require("jcc_rpc/lib/fetch").default;

JcConfig.prototype.getPairs = async () => {
  const data = {
    method: "get",
    url: super.getUrl() + "/static/config/coins_pairs_config" + "?t=" + new Date().getTime()
  };
  const res = await fetch(data);
  return res;
};

const configInst = ConfigFactory.init(["https://jccdex.cn"]);
const subscribeInst = SubscribeFactory.init();
const CONFIG_NAME = "pollingConfig";
const configTask = configInst.getConfig.bind(configInst);
const PAIRS_NAME = "pollingPairs";
const pairsTask = configInst.getPairs.bind(configInst);

const polling = true;
const timer = 30 * 60 * 1000;

exports.init = () => {
  subscribeInst
    .register(CONFIG_NAME, configTask, polling, timer)
    .register(PAIRS_NAME, pairsTask, polling, timer)
    .start(CONFIG_NAME)
    .start(PAIRS_NAME);
};
