# Fetch kline data of Huobi and Okex

```shell
# 获取huobi历史K线数据
# 以btcusdt, 周期1day为例
# 周期: 1min|5min|15min|30min|60min|4hour|1day|1mon|1week|1year

symbol=btcusdt
period=1day
node generate-period.js -s $symbol -p $period
node fetch.js -s $symbol -p $period

# 获取okex历史K线数据, 最多只能获取1440条历史数据
# 以btcusdt, 周期1day为例
# 周期: 1min|3min|5min|15min|30min|1hour|2hour|4hour|6hour|12hour|1day|1week

symbol=btc-usdt
period=1day
node generate-period.js -s $symbol -p $period
node fetch.js -s $symbol -p $period

```
