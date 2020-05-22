<template>
  <el-container>
    <!-- <el-header>
      <el-row style="margin-top:20px;">
        <el-col :span="4">请先加载配置文件：</el-col>
        <el-col :span="10">
          <input type="file" @change="getData" />
        </el-col>
      </el-row>
    </el-header> -->
    <el-main>
      <el-row :gutter="20">
        <el-col :span="12"
          ><div class="grid-content bg-purple">
            <div>
              网格交易：在威链上挂网格交易
            </div>
            <!-- <div style="margin-top: 10px">火币每笔挂单总额不小于5，每笔数量不小于1</div> -->
            <div style="margin-top: 10px">每笔实际挂单价格介于价格上限和下限之间</div>
            <div style="margin-top: 10px">每笔实际挂单数量介于数量上限和下限之间</div>
            <div style="margin-top: 10px">总笔数表示希望挂多少订单</div>
            <div style="margin-top: 10px">定时检查当前挂单，若成交后立即挂反向订单</div>

            <el-form :model="gridData" style="margin-top:20px;" label-position="right" label-width="160px">
              <el-form-item label="交易所">
                <el-select v-model="gridData.exchange" placeholder="交易所">
                  <!-- <el-option label="火币" value="huobi"></el-option> -->
                  <el-option label="威链" value="weidex"></el-option>

                  <!-- <el-option label="Okex" value="okex"></el-option> -->
                </el-select>
              </el-form-item>
              <el-form-item label="交易对">
                <el-select v-model="gridData.pair" placeholder="交易对">
                  <el-option label="XRP/USDT" value="XRP/USDT"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="买卖">
                <el-select v-model="gridData.type" placeholder="买或卖">
                  <el-option label="买" value="buy"></el-option>
                  <el-option label="卖" value="sell"></el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="每笔价格上限">
                <el-input v-model="gridData.highPrice" style="width:60%" placeholder="应大于0"></el-input>
              </el-form-item>
              <el-form-item label="每笔价格下限">
                <el-input v-model="gridData.lowPrice" style="width:60%" placeholder="应大于0"></el-input>
              </el-form-item>
              <el-form-item label="每笔数量上限">
                <el-input v-model="gridData.highAmount" style="width:60%" placeholder="应大于0"></el-input>
              </el-form-item>
              <el-form-item label="每笔数量下限">
                <el-input v-model="gridData.lowAmount" style="width:60%" placeholder="应大于0"></el-input>
              </el-form-item>
              <el-form-item label="总笔数">
                <el-input v-model="gridData.quantity" style="width:60%" placeholder="正整数"></el-input>
              </el-form-item>
              <el-form-item label="买进收益率">
                <el-input v-model="gridData.buyProfit" style="width:60%" placeholder="应大于0"></el-input>
              </el-form-item>
              <el-form-item label="卖出收益率">
                <el-input v-model="gridData.sellProfit" style="width:60%" placeholder="应大于0"></el-input>
              </el-form-item>
              <el-form-item label="执行周期">
                <el-input v-model="gridData.timer" style="width:60%" placeholder="单位：分钟"></el-input>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="stopSubmitGrid" :loading="gridLoading">停止网格交易</el-button>
                <el-button type="primary" @click="submitGrid" :loading="gridLoading">发起网格交易</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-col>
        <el-col :span="12"
          ><div class="grid-content bg-purple">
            <div>套利交易：定期检查火币和威链交易对之间是否存在利润</div>
          </div>
          <el-form :model="arbitrageData" style="margin-top:20px;" label-position="right" label-width="160px">
            <el-form-item label="交易所">
              <el-select v-model="arbitrageData.exchange" placeholder="交易所" style="width:60%">
                <el-option label="火币" value="huobi"></el-option>
                <!-- <el-option label="Okex" value="okex"></el-option> -->
              </el-select>
            </el-form-item>
            <el-form-item label="交易对">
              <el-select v-model="arbitrageData.pair" placeholder="交易对" style="width:60%">
                <el-option label="XRP/USDT" value="XRP/USDT"></el-option>
              </el-select>
            </el-form-item>
            <el-form-item label="收益率">
              <el-input v-model="arbitrageData.arbitrageProfit" style="width:60%" placeholder="应大于0"></el-input>
            </el-form-item>
            <el-form-item label="执行周期">
              <el-input v-model="arbitrageData.period" style="width:60%" placeholder="单位：分钟"></el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="stopArbitrage" :loading="arbitrageLoading">停止套利程序</el-button>
              <el-button type="primary" @click="submitArbitrage" :loading="arbitrageLoading">发起套利程序</el-button>
            </el-form-item>
          </el-form>
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
const WebSocket = require("isomorphic-ws");
const ws = new WebSocket(`ws://${window.location.hostname}:9099`);
ws.onopen = () => {
  ws.onmessage = (message) => {
    console.log(message);
    try {
      message = JSON.parse(message.data);
      const { method, success } = message;
      if (method === "autoGridTrading") {
        if (success) {
          alert("网格自动交易程序执行成功");
        } else {
          alert("网格自动交易程序执行失败");
        }
      } else if (method === "arbitrage") {
        if (success) {
          alert("套利程序执行成功");
        } else {
          alert("套利程序执行失败");
        }
      } else if (method === "stopArbitrage") {
        alert("成功停止套利程序");
      } else if (method === "stopAutoGridTrading") {
        alert("成功停止网格程序");
      }
    } catch (error) {}
  };
};

export default {
  data() {
    return {
      arbitrageData: {
        exchange: "huobi",
        pair: "XRP/USDT",
        arbitrageProfit: "",
        period: ""
      },
      gridData: {
        exchange: "weidex",
        pair: "XRP/USDT",
        highAmount: "",
        lowAmount: "",
        highPrice: "",
        lowPrice: "",
        quantity: "",
        type: "buy",
        buyProfit: "",
        sellProfit: "",
        timer: ""
      },
      arbitrageLoading: false,
      gridLoading: false
    };
  },
  mounted() {},
  methods: {
    async submitArbitrage() {
      const { arbitrageProfit, period } = this.arbitrageData;
      if (Number.isNaN(Number(arbitrageProfit)) || Number(arbitrageProfit) <= 0) {
        return alert("收益率必须大于0");
      }

      if (Number.isNaN(Number(period)) || Number(period) <= 0) {
        return alert("执行周期必须大于0分钟");
      }
      this.$confirm(`确认开始${this.arbitrageData.pair}套利程序？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          if (this.arbitrageData.exchange === "huobi") {
            ws.send(JSON.stringify(Object.assign({ method: "arbitrage" }, this.arbitrageData)));
          }
        })
        .catch(() => {});
    },
    async submitGrid() {
      const { highAmount, lowAmount, highPrice, lowPrice, quantity, buyProfit, sellProfit, timer } = this.gridData;
      if (Number.isNaN(Number(lowPrice)) || Number(lowPrice) <= 0) {
        return alert("价格下限必须大于0");
      }
      if (Number.isNaN(Number(highPrice)) || Number(highPrice) <= Number(lowPrice)) {
        return alert("价格上限必须大于价格下限");
      }
      if (Number.isNaN(Number(lowAmount)) || Number(lowAmount) <= 0) {
        return alert("数量下限必须大于0");
      }
      if (Number.isNaN(Number(highAmount)) || Number(highAmount) <= Number(lowAmount)) {
        return alert("数量上限必须大于数量下限");
      }
      if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
        return alert("总笔数必须是正整数");
      }
      if (Number.isNaN(Number(buyProfit)) || Number(buyProfit) <= 0) {
        return alert("买进收益率必须大于0");
      }
      if (Number.isNaN(Number(sellProfit)) || Number(sellProfit) <= 0) {
        return alert("卖出收益率必须大于0");
      }
      if (Number.isNaN(Number(timer)) || Number(timer) <= 0) {
        return alert("执行周期必须大于0分钟");
      }

      this.$confirm(`确认开始${this.gridData.pair}网格程序？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          if (this.gridData.exchange === "huobi") {
          } else if (this.gridData.exchange === "weidex") {
            ws.send(JSON.stringify(Object.assign({ method: "autoGridTrading" }, this.gridData)));
          }
        })
        .catch(() => {});
    },
    stopSubmitGrid() {
      this.$confirm(`确认停止${this.gridData.pair}网格交易程序？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          ws.send(JSON.stringify(Object.assign({ method: "stopAutoGridTrading" }, this.arbitrageData)));
        })
        .catch(() => {});
    },
    stopArbitrage() {
      this.$confirm(`确认停止${this.arbitrageData.pair}套利程序？`, "提示", {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning"
      })
        .then(() => {
          ws.send(JSON.stringify(Object.assign({ method: "stopArbitrage" }, this.arbitrageData)));
        })
        .catch(() => {});
    },
    getData(e) {}
  }
};
</script>

<style>
.container {
  margin: 0 auto;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.title {
  font-family: "Quicksand", "Source Sans Pro", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  display: block;
  font-weight: 300;
  font-size: 100px;
  color: #35495e;
  letter-spacing: 1px;
}

.subtitle {
  font-weight: 300;
  font-size: 42px;
  color: #526488;
  word-spacing: 5px;
  padding-bottom: 15px;
}

.links {
  padding-top: 15px;
}
</style>
