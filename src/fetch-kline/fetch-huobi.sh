#!/bin/bash
for symbol in "btc-usdt" "eth-usdt" "eos-usdt" "xrp-usdt"
do
    for period in "60min" "4hour" "1day"
    do
        node ./huobi/generate-period.js -s $symbol -p $period
        node ./huobi/fetch.js -s $symbol -p $period
    done
done
