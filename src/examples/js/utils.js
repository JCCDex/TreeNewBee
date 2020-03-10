const Configs = require("./config");
const ccxt = require("../../ccxt");
const utils = {
  currentExchange: null,
  currentAlisa: "",
  async getExchange(type) {
    switch (type) {
      case "weidex":
        if (this.currentExchange && type === this.currentAlisa) {
          return this.currentExchange;
        } else {
          this.currentExchange = new ccxt["weidex"]({
            address: Configs.jingtumHuobi.address,
            secret: Configs.jingtumHuobi.secret,
            enableRateLimit: true
          });
          await this.currentExchange.fetchMarkets();
          this.currentAlisa = "weidex";
          return this.currentExchange;
        }
      case "huobi":
        if (this.currentExchange && type === this.currentAlisa) {
          return this.currentExchange;
        } else {
          this.currentExchange = new ccxt["huobipro"]({
            apiKey: Configs.huobi.access_key,
            secret: Configs.huobi.secretkey,
            verbose: false, // set to true to see more debugging output
            timeout: 60000,
            enableRateLimit: true, // add this
            urls: {
              api: {
                market: "https://api.huobi.io",
                public: "https://api.huobi.io",
                private: "https://api.huobi.io",
                zendesk: "https://huobiglobal.zendesk.com/hc/en-us/articles"
              }
            },
            hostname: "api.huobi.io" // ←---------------  ADD THIS
          });
          // this.currentExchange.headers = await scrapeCloudflareHttpHeaderCookie (exchange.urls.www)
          await this.currentExchange.fetchMarkets();
          this.currentAlisa = "huobi";
          return this.currentExchange;
        }
      case "okex":
        this.currentExchange = new ccxt["okex3"]({
          apiKey: Configs.okex.access_key,
          secret: Configs.okex.secretkey,
          verbose: false, // set to true to see more debugging output
          timeout: 60000,
          enableRateLimit: true,
          password: Configs.okex.privatekey
        });
        await this.currentExchange.fetchMarkets();
        this.currentAlisa = "okex";
        return this.currentExchange;
      default:
        break;
    }
  }
};
module.exports = {
  utils
};
