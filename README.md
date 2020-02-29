# TreeNewBee

这是个吹牛逼的项目,anyway，就是这个意思

谨以此项目名称纪念各种对我们吹牛逼但是没有实现的团队和个人，不仅限于搬砖。非要逼我们自己来做，ok，let's do it.

使用说明：

1、cd src,npm i 安装环境

2、配置文件:src/examples/js/testconfig.js

    1) "exchanges":[["huobi","weidex"]],数组里面配置要映射的交易所映射火币订单到威链：
    填写"huobi"的{"access_key": "","secretkey": ""}信息，"jingtum1"的{"address": "","secret": ""}

    2) "exchanges":[["okex","weidex"]],映射okex订单到威链：
    填写"okex"的{"access_key": "","secretkey": "","privatekey": ""}信息，"jingtum1"的{"address": "","secret": ""}

    3) "moveBrickExchanges"的值:["huobi","weidex"],在火币和威链之间寻找差价并搬砖

3、cd src/examples/js/,node start -O -N -M -T,启动交易对映射，以及自动在多个交易所之间寻找最优价差并挂单,以及启动三角套利机会检测。访问 

ok 交易所需要梯子。
