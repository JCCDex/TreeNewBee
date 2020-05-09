const { SubscribeFactory, ConfigFactory } = require("jcc_rpc");

const configInst = ConfigFactory.init(["https://jccdex.cn"]);

const subscribeInst = SubscribeFactory.init();

const TASK_NAME = "pollingConfig";
const task = configInst.getConfig.bind(configInst);
const polling = true;
const timer = 60 * 60 * 1000;

module.exports = {
  init(weidex) {
    subscribeInst
      .register(TASK_NAME, task, polling, timer)
      .on(TASK_NAME, (err, res) => {
        if (err) {
          return;
        }
        if (res) {
          const { exHosts, infoHosts } = res;
          if (Array.isArray(exHosts)) {
            weidex.configs.exHosts = exHosts;
          }
          if (Array.isArray(infoHosts)) {
            weidex.configs.infoHosts = infoHosts;
          }
        }
      })
      .start(TASK_NAME);
  }
};
