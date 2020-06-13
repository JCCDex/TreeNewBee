#!/bin/bash
for symbol in "btc-usdt" "eth-usdt" "eos-usdt" "xrp-usdt"
do
    for period in "1hour" "2hour" "4hour" "6hour" "1day"
    do
        node ./okex/generate-period.js -s $symbol -p $period
        node ./okex/fetch.js -s $symbol -p $period
    done
    
done