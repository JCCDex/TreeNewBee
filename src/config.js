"use strict";

const config = {
  exchanges: [["huobi", "weidex"]],
  moveBrickExchanges: ["huobi", "weidex"],
  gridProfit: 0.01, //网格利润率
  arbitrageProfit: 0.01, // 搬砖利润率
  huobi: {
    access_key: "",
    secretkey: "",
    market: "https://api.huobi.io",
    public: "https://api.huobi.io",
    private: "https://api.huobi.io",
    zendesk: "https://huobiglobal.zendesk.com/hc/en-us/articles",
    hostname: "api.huobi.io" // ←---------------  ADD THIS
  },
  okex: {
    access_key: "",
    secretkey: "",
    privatekey: ""
  },
  jingtumHuobi: {
    address: "",
    secret: ""
  },
  jingtumOkex: {
    address: "",
    secret: ""
  },
  tradePairs: ["XRP/USDT"],
  amountLimit: {
    "XRP/USDT": {
      maxAmount: 10
    }
  }
};
module.exports = config;
