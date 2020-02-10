'use strict';

const configs = {
    "exchanges":[["huobi","weidex"]],
    "huobi": {
        "access_key": "",
        "secretkey": "",
        'market': 'https://api.huobi.io',
        'public': 'https://api.huobi.io',
        'private': 'https://api.huobi.io',
        'zendesk': 'https://huobiglobal.zendesk.com/hc/en-us/articles',
        'hostname': 'api.huobi.io', // ←---------------  ADD THIS
    },
    "okex": {
        "access_key": "",
        "secretkey": "",
        "privatekey": ""
    },
    "weidexConfig": {
        "jc_config": "https://weidex.vip/static/config/jc_config.json",
        "coins_pairs_config": "https://weidex.vip/static/config/coins_pairs_config.json"
    },
    "jingtum1": {
        "address": "",
        "secret": "",
    },
    "jingtum2": {
        "address": "",
        "secret": "",
    },
    "tradePairs":[
        "XRP/USDT"
    ]

}
module.exports = (
    configs
)