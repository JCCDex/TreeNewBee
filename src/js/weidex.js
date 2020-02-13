/* eslint-disable no-unused-vars */
/* eslint-disable no-dupe-class-members */
/* eslint-disable no-console */

'use strict';

//  ---------------------------------------------------------------------------

const Exchange = require ('./base/Exchange');
const { AuthenticationError, ExchangeError, ExchangeNotAvailable, InvalidOrder, OrderNotFound, InsufficientFunds, RequestTimeout, ArgumentsRequired } = require ('./base/errors');
const JCCExchange = require ('jcc_exchange').JCCExchange;
//  ---------------------------------------------------------------------------

module.exports = class weidex extends Exchange {
    describe () {
        // this.getConfigs ();
        return this.deepExtend (super.describe (), {
            'id': 'weidex',
            'name': 'WEIDEX',
            'countries': ['CN'],
            'rateLimit': 2000,
            'userAgent': this.userAgents['chrome39'],
            'address': '',
            'secret': '',
            'configs': {},
            'coinpairConfigs': {},
            'accounts': undefined,
            'accountsById': undefined,
            'hostname': 'jccdex.cn',
            'has': {
                'CORS': false,
                'fetchTickers': false,
                'fetchDepositAddress': false,
                'fetchOHLCV': false,
                'fetchOrder': false,
                'fetchOrders': true,
                'fetchOpenOrders': true,
                'fetchClosedOrders': false,
                'fetchTradingLimits': false,
                'fetchMyTrades': false,
                'withdraw': false,
                'fetchCurrencies': true,
                'fetchDeposits': false,
                'fetchWithdrawals': false,
            },
            'timeframes': {
                '1m': '1min',
                '5m': '5min',
                '15m': '15min',
                '30m': '30min',
                '1h': '60min',
                '4h': '4hour',
                '1d': '1day',
                '1w': '1week',
                '1M': '1mon',
                '1y': '1year',
            },
            'urls': {
                'logo': 'https://user-images.githubusercontent.com/1294454/27766569-15aa7b9a-5edd-11e7-9e7f-44791f4ee49c.jpg',
                'api': {
                    'market': 'https://{hostname}',
                    'public': 'https://{hostname}',
                    'private': 'https://{hostname}',
                    'zendesk': 'https://jccdex.cn',
                },
                'www': 'https://www.jccdex.cn',
                'referral': 'https://www.jccdex.cn',
                'doc': 'https://jccdex.cn',
                'fees': 'https://jccdex.cn',
            },
            'api': {
                'market': {
                    'get': [
                    ],
                },
                'public': {
                    'get': [
                        'info/depth/{currency}/{type}',
                        'exchange/balances/{address}',
                        'exchange/detail/{hash}', // 挂单xingxi
                    ],
                    'post': [
                    ],
                },
                'private': {
                    'get': [
                        'exchange/sequence/{account}', // 查询指定账户的sequence
                        'exchange/balances/{account}', // 查询指定账户的资产情况
                        'wallet/offer/:uuid', // 查询账户挂单
                    ],
                    'post': [
                        'exchange/sign_order/{sign}', // 挂单
                        'exchange/sign_cancel_order',
                    ],
                },
            },
            'fees': {
                'trading': {
                    'tierBased': false,
                    'percentage': true,
                    'maker': 0.002,
                    'taker': 0.002,
                },
            },
            'exceptions': {
                'exact': {
                    // err-code
                    'timeout': RequestTimeout, // {"ts":1571653730865,"status":"error","err-code":"timeout","err-msg":"Request Timeout"}
                    'gateway-internal-error': ExchangeNotAvailable, // {"status":"error","err-code":"gateway-internal-error","err-msg":"Failed to load data. Try again later.","data":null}
                    'account-frozen-balance-insufficient-error': InsufficientFunds, // {"status":"error","err-code":"account-frozen-balance-insufficient-error","err-msg":"trade account balance is not enough, left: `0.0027`","data":null}
                    'invalid-amount': InvalidOrder, // eg "Paramemter `amount` is invalid."
                    'order-limitorder-amount-min-error': InvalidOrder, // limit order amount error, min: `0.001`
                    'order-marketorder-amount-min-error': InvalidOrder, // market order amount error, min: `0.01`
                    'order-limitorder-price-min-error': InvalidOrder, // limit order price error
                    'order-limitorder-price-max-error': InvalidOrder, // limit order price error
                    'order-orderstate-error': OrderNotFound, // canceling an already canceled order
                    'order-queryorder-invalid': OrderNotFound, // querying a non-existent order
                    'order-update-error': ExchangeNotAvailable, // undocumented error
                    'api-signature-check-failed': AuthenticationError,
                    'api-signature-not-valid': AuthenticationError, // {"status":"error","err-code":"api-signature-not-valid","err-msg":"Signature not valid: Incorrect Access key [Access key错误]","data":null}
                    'base-record-invalid': OrderNotFound, // https://github.com/ccxt/ccxt/issues/5750
                },
            },
            'options': {
                // https://github.com/ccxt/ccxt/issues/5376
                'fetchOrdersByStatesMethod': 'private_get_order_orders', // 'private_get_order_history' // https://github.com/ccxt/ccxt/pull/5392
                'fetchOpenOrdersMethod': 'fetch_open_orders_v1', // 'fetch_open_orders_v2' // https://github.com/ccxt/ccxt/issues/5388
                'createMarketBuyOrderRequiresPrice': true,
                'fetchMarketsMethod': 'publicGetCommonSymbols',
                'fetchBalanceMethod': 'privateGetExchangeBalancesAddress',
                'createOrderMethod': 'privatePostOrderOrdersPlace',
                'language': 'en-US',
            },
            'commonCurrencies': {
                // https://github.com/ccxt/ccxt/issues/6081
                // https://github.com/ccxt/ccxt/issues/3365
                // https://github.com/ccxt/ccxt/issues/2873
                'GET': 'Themis', // conflict with GET (Guaranteed Entrance Token, GET Protocol)
                'HOT': 'Hydro Protocol', // conflict with HOT (Holo) https://github.com/ccxt/ccxt/issues/4929
            },
        });
    }

    async fetchBalance () {
        await this.loadMarkets ();
        const response = await this.publicGetExchangeBalancesAddress ({ 'address': this.address });
        // return response;
        const balances = response['data'];
        const result = { 'info': response };
        for (let i = 0; i < balances.length; i++) {
            const balance = balances[i];
            const currencyId = this.safeString (balance, 'currency');
            const code = this.safeCurrencyCode (currencyId);
            let account = undefined;
            if (code in result) {
                account = result[code];
            } else {
                account = this.account ();
            }
            account['free'] = this.safeFloat (balance, 'value');
            account['used'] = this.safeFloat (balance, 'freezed');
            result[code] = account;
        }
        return this.parseBalance (result);
    }

    async fetchOrders (_symbol = undefined, _p = 0) {
        return this.fetchOpenOrders (_symbol, _p);
    }

    async fetchOpenOrders (symbol = ' ', p = 0) {
        if (symbol === undefined) {
            throw new ArgumentsRequired (' fetchOpenOrders requires a symbol argument');
        }
        if (p === undefined) {
            throw new ArgumentsRequired (' fetchOpenOrders requires a symbol argument');
        }
        await this.loadMarkets ();
        const response = await this.privateGetWalletOfferUuid ({ 'p': p, 's': 100, 'w': this.address });
        let orders = undefined;
        if (response.code === '0') {
            orders = this.safeValue (response, 'data', []);
            if (orders.count > 0) {
                return this.parseOrders (orders.list, undefined, undefined, 100);
            } else {
                return [];
            }
        } else {
            return null;
        }
    }

    parseOrder (order, market = undefined) {
        //
        //     {                  id:  13997833014,
        //                    symbol: "ethbtc",
        //              'account-id':  3398321,
        //                    amount: "0.045000000000000000",
        //                     price: "0.034014000000000000",
        //              'created-at':  1545836976871,
        //                      type: "sell-limit",
        //            'field-amount': "0.045000000000000000", // they have fixed it for filled-amount
        //       'field-cash-amount': "0.001530630000000000", // they have fixed it for filled-cash-amount
        //              'field-fees': "0.000003061260000000", // they have fixed it for filled-fees
        //             'finished-at':  1545837948214,
        //                    source: "spot-api",
        //                     state: "filled",
        //             'canceled-at':  0                      }
        //
        //     {                  id:  20395337822,
        //                    symbol: "ethbtc",
        //              'account-id':  5685075,
        //                    amount: "0.001000000000000000",
        //                     price: "0.0",
        //              'created-at':  1545831584023,
        //                      type: "buy-market",
        //            'field-amount': "0.029100000000000000", // they have fixed it for filled-amount
        //       'field-cash-amount': "0.000999788700000000", // they have fixed it for filled-cash-amount
        //              'field-fees': "0.000058200000000000", // they have fixed it for filled-fees
        //             'finished-at':  1545831584181,
        //                    source: "spot-api",
        //                     state: "filled",
        //             'canceled-at':  0                      }
        //
        const id = this.safe_integer (order, 'seq');
        // let side = undefined;
        const type = 'default';
        // let status = undefined;
        // if ('type' in order) {
        //     const orderType = order['type'].split ('-');
        //     side = orderType[0];
        //     type = orderType[1];
        //     status = this.parseOrderStatus (this.safeString (order, 'state'));
        // }
        let symbol = undefined;
        let side = undefined;
        const timestamp = this.safeInteger (order, 'time');
        let amount = 0;
        let counterAmount = 0;
        let price = 0;
        const filled = 0;
        const status = 'open';
        if (order.flag === 1) {
            symbol = order.takerPays.currency + '/' + order.takerGets.currency;
            amount = this.safeFloat (order.takerPays, 'value');
            counterAmount = this.safeFloat (order.takerGets, 'value');
            side = 'buy';
        } else {
            symbol = order.takerGets.currency + '/' + order.takerPays.currency;
            amount = this.safeFloat (order.takerGets, 'value');
            counterAmount = this.safeFloat (order.takerPays, 'value');
            side = 'sell';
        }
        price = counterAmount / amount;
        if (price === 0.0) {
            price = undefined;
        }
        const cost = undefined;
        const remaining = amount;
        const average = undefined;
        // if (filled !== undefined) {
        //     if (amount !== undefined) {
        //         remaining = amount - filled;
        //     }
        //     // if cost is defined and filled is not zero
        //     if ((cost !== undefined) && (filled > 0)) {
        //         average = cost / filled;
        //     }
        // }
        const feeCost = 0;
        const fee = 0;
        return {
            'info': order,
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'symbol': symbol,
            'type': type,
            'side': side,
            'price': price,
            'average': average,
            'cost': cost,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': fee,
        };
    }

    async createOrder (symbol, tradeType, side, num, price) {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const hosts = this.configs.exHosts;
        // const hosts = ['srje071qdew231.jccdex.cn', 'srje115qd43qw2.jccdex.cn'];
        console.log (hosts);
        const port = 443;
        const https = true;
        const retry = 3; // default value
        // init value of hosts、port、https & retry
        JCCExchange.init (hosts, port, https, retry);
        // create an order
        // buy 1 jcc with 1 swt
        // const address = this.address;
        // const secret = this.secret;
        // // const amount = "1";
        // const base = market.baseId;
        // const counter = market.quoteId;
        // // const sum = '1';
        // // const type = "buy"; // if sell 1 jjcc with 1 swt, the value of type is "sell"
        // const platform = 'jac1nNfVMMawUSqRiauvXm2jhPj1E4Gukk'; // swtc address for service charge
        // const issuer = 'jGa9J9TkqtBcUoHe2zqhVFFbgUVED6o9or'; // the default value is "jGa9J9TkqtBcUoHe2zqhVFFbgUVED6o9or"
        const address = this.address;
        const secret = this.secret;
        const amount = this.round (num, 15);
        const base = market.baseId.toLowerCase ();
        const counter = market.quoteId.toLowerCase ();
        const sum = this.round (amount * price, 15);
        const type = side.toLowerCase (); // if sell 1 jjcc with 1 swt, the value of type is "sell"
        const platform = ''; // swtc address for service charge
        const issuer = 'jGa9J9TkqtBcUoHe2zqhVFFbgUVED6o9or'; // the default value is "jGa9J9TkqtBcUoHe2zqhVFFbgUVED6o9or"
        try {
            console.log ('start order');
            console.log (amount + '-' + base + '-' + counter + '-' + sum + '-' + type);
            const hash = await JCCExchange.createOrder (address, secret, amount, base, counter, sum, type, platform, issuer);
            console.log ('hash:' + hash);
            return hash;
        } catch (error) {
            console.log (error);
        }
    }

    round (v, e) {
        const vList = v.toString ().split ('.');
        e = e - vList[0].length;
        let t = 1;
        for (; e > 0; t *= 10, e--);
        for (; e < 0; t /= 10, e++);
        return (Math.round (v * t) / t).toString ();
    }

    async cancelOrder (id, symbol = undefined) {
        const hosts = this.configs.exHosts;
        const port = 443;
        const https = true;
        const retry = 3; // default value
        // init value of hosts、port、https & retry
        JCCExchange.init (hosts, port, https, retry);
        // cancel an order
        const address = this.address;
        const secret = this.secret;
        const orderSequence = id;
        try {
            const hash = await JCCExchange.cancelOrder (address, secret, orderSequence);
            console.log (hash);
            return {
                'id': orderSequence,
                'hash': hash,
                'status': 'canceled',
            };
        } catch (error) {
            console.log (error);
        }
    }

    sign (path, api = 'public', method = 'GET', params = {}, headers = undefined, body = undefined) {
        let url = '/';
        if (api === 'market') {
            url += api;
        } else if ((api === 'public') || (api === 'private')) {
            // url += this.version;
        }
        url += this.implodeParams (path, params);
        const query = this.omit (params, this.extractParams (path));
        this.getHosts (path);
        if (api === 'private') {
            const timestamp = this.ymdhms (this.milliseconds (), 'T');
            let request = {
                'SignatureMethod': 'HmacSHA256',
                'SignatureVersion': '2',
                // 'AccessKeyId': this.apiKey,
                'Timestamp': timestamp,
            };
            if (method !== 'POST') {
                request = this.extend (request, query);
            }
            request = this.keysort (request);
            let auth = this.urlencode (request);
            // unfortunately, PHP demands double quotes for the escaped newline symbol
            // eslint-disable-next-line quotes
            const payload = [method, this.hostname, url, auth].join ("\n");
            const signature = this.hmac (this.encode (payload), this.encode (this.secret), 'sha256', 'base64');
            auth += '&' + this.urlencode ({ 'Signature': signature });
            url += '?' + auth;
            if (method === 'POST') {
                body = this.json (query);
                headers = {
                    'Content-Type': 'application/json',
                };
            } else {
                headers = {
                    'Content-Type': 'application/x-www-form-urlencoded',
                };
            }
        } else {
            if (Object.keys (params).length) {
                url += '?' + this.urlencode (params);
            }
        }
        url = this.implodeParams (this.urls['api'][api], {
            'hostname': this.hostname,
        }) + url;
        return { 'url': url, 'method': method, 'body': body, 'headers': headers };
    }

    getHosts (path) {
        const type = path.split ('/');
        // eslint-disable-next-line init-declarations
        let random;
        switch (type[0]) {
        case 'exchange':
            random = Math.floor (Math.random () * this.configs.exHosts.length);
            this.hostname = this.configs.exHosts[random];
            break;
        case 'info':
            random = Math.floor (Math.random () * this.configs.infoHosts.length);
            this.hostname = this.configs.infoHosts[random];
            break;
        default:
            this.hostname = 'explorer.jccdex.cn';
            break;
        }
    }

    handleErrors (httpCode, reason, url, method, headers, body, response, requestHeaders, requestBody) {
        if (response === undefined) {
            return; // fallback to default error handler
        }
        if ('status' in response) {
            //
            //     {"status":"error","err-code":"order-limitorder-amount-min-error","err-msg":"limit order amount error, min: `0.001`","data":null}
            //
            const status = this.safeString (response, 'status');
            if (status === 'error') {
                const code = this.safeString (response, 'err-code');
                const feedback = this.id + ' ' + body;
                this.throwExactlyMatchedException (this.exceptions['exact'], code, feedback);
                const message = this.safeString (response, 'err-msg');
                this.throwExactlyMatchedException (this.exceptions['exact'], message, feedback);
                throw new ExchangeError (feedback);
            }
        }
    }

    async getAccountSequence (account) {
        const response = await this.privateGetExchangeSequenceAccount ({ 'account': account });
        return response;
    }

    async fetchOrderBook (symbol, limit = 'more') {
        await this.loadMarkets ();
        const market = this.market (symbol);
        const response = await this.publicGetInfoDepthCurrencyType ({ 'currency': market.id, 'type': limit });
        if (response.success) {
            if (!response['data']) {
                throw new ExchangeError (this.id + ' fetchOrderBook() returned empty response: ' + this.json (response));
            }
            const orderbook = this.safeValue (response, 'data');
            const result = this.parseOrderBook (orderbook, orderbook['ts'], 'bids', 'asks', 'price', 'amount');
            result['nonce'] = orderbook['version'];
            return result;
        } else {
            throw new ExchangeError (this.id + ' fetchOrderBook() returned unrecognized response: ' + this.json (response));
        }
    }

    parseOrderBook (orderbook, timestamp = undefined, bidsKey = 'bids', asksKey = 'asks', priceKey = 0, amountKey = 1, market = undefined) {
        const result = {
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'nonce': undefined,
        };
        const sides = [ bidsKey, asksKey ];
        for (let i = 0; i < sides.length; i++) {
            const side = sides[i];
            const orders = [];
            const bidasks = this.safeValue (orderbook, side);
            for (let k = 0; k < bidasks.length; k++) {
                orders.push (this.parseBidAsk (bidasks[k], priceKey, amountKey, market));
            }
            result[side] = orders;
        }
        result[bidsKey] = this.sortBy (result[bidsKey], 0, true);
        result[asksKey] = this.sortBy (result[asksKey], 0);
        return result;
    }

    async fetchMarkets () {
        const result = [];
        const markets = this.coinpairConfigs.transPairs;
        for (let i = 0; i < markets.length; i++) {
            const market = markets[i];
            const id = market.base + '-' + market.counter;
            const baseId = market.base;
            const quoteId = market.counter;
            const base = this.safeCurrencyCode (market.baseTitle);
            const quote = this.safeCurrencyCode (market.counterTitle);
            const symbol = base + '/' + quote;
            const precision = {
                'amount': this.safeFloat (market, 'amountDecimal'),
                'price': this.safeFloat (market, 'priceDecimal'),
            };
            const minAmount = this.safeFloat (market, 'minAmount');
            result.push ({
                'id': id,
                'symbol': symbol,
                'base': base,
                'quote': quote,
                'baseId': baseId,
                'quoteId': quoteId,
                'active': true,
                'precision': precision,
                'limits': {
                    'amount': {
                        'min': minAmount,
                        'max': undefined,
                    },
                    'price': {
                        'min': Math.pow (10, -precision['price']),
                        'max': undefined,
                    },
                    'cost': {
                        'min': undefined,
                        'max': undefined,
                    },
                },
                'info': market,
            });
        }
        return result;
    }

    async fetchOrder (hash) {
        await this.loadMarkets ();
        const response = await this.publicGetExchangeDetailHash ({ 'hash': hash });
        const order = this.safeValue (response, 'data');
        return this.parseOrderDetail (order);
    }

    parseOrderDetail (order) {
        //
        //     {                  id:  13997833014,
        //                    symbol: "ethbtc",
        //              'account-id':  3398321,
        //                    amount: "0.045000000000000000",
        //                     price: "0.034014000000000000",
        //              'created-at':  1545836976871,
        //                      type: "sell-limit",
        //            'field-amount': "0.045000000000000000", // they have fixed it for filled-amount
        //       'field-cash-amount': "0.001530630000000000", // they have fixed it for filled-cash-amount
        //              'field-fees': "0.000003061260000000", // they have fixed it for filled-fees
        //             'finished-at':  1545837948214,
        //                    source: "spot-api",
        //                     state: "filled",
        //             'canceled-at':  0                      }
        //
        //     {                  id:  20395337822,
        //                    symbol: "ethbtc",
        //              'account-id':  5685075,
        //                    amount: "0.001000000000000000",
        //                     price: "0.0",
        //              'created-at':  1545831584023,
        //                      type: "buy-market",
        //            'field-amount': "0.029100000000000000", // they have fixed it for filled-amount
        //       'field-cash-amount': "0.000999788700000000", // they have fixed it for filled-cash-amount
        //              'field-fees': "0.000058200000000000", // they have fixed it for filled-fees
        //             'finished-at':  1545831584181,
        //                    source: "spot-api",
        //                     state: "filled",
        //             'canceled-at':  0                      }
        //
        const id = this.safe_integer (order, 'Sequence');
        // let side = undefined;
        const type = 'default';
        // let status = undefined;
        // if ('type' in order) {
        //     const orderType = order['type'].split ('-');
        //     side = orderType[0];
        //     type = orderType[1];
        //     status = this.parseOrderStatus (this.safeString (order, 'state'));
        // }
        let symbol = undefined;
        let side = undefined;
        const timestamp = undefined;
        let amount = 0;
        let counterAmount = 0;
        let price = 0;
        const filled = 0;
        const status = 'open';
        if (order.flag === 1) {
            symbol = this.getCurrency (order.TakerPays) + '/' + this.getCurrency (order.TakerGets);
            amount = this.safeFloat (order.TakerPays, 'value');
            counterAmount = this.safeFloat (order.TakerGets, 'value');
            side = 'buy';
        } else {
            symbol = this.getCurrency (order.TakerGets) + '/' + this.getCurrency (order.TakerPays);
            amount = this.safeFloat (order.TakerGets, 'value');
            counterAmount = this.safeFloat (order.TakerPays, 'value');
            side = 'sell';
        }
        price = counterAmount / amount;
        if (price === 0.0) {
            price = undefined;
        }
        const cost = undefined;
        const remaining = amount;
        const average = undefined;
        // if (filled !== undefined) {
        //     if (amount !== undefined) {
        //         remaining = amount - filled;
        //     }
        //     // if cost is defined and filled is not zero
        //     if ((cost !== undefined) && (filled > 0)) {
        //         average = cost / filled;
        //     }
        // }
        const feeCost = 0;
        const fee = 0;
        return {
            'info': order,
            'id': id,
            'timestamp': timestamp,
            'datetime': this.iso8601 (timestamp),
            'lastTradeTimestamp': undefined,
            'symbol': symbol,
            'type': type,
            'side': side,
            'price': price,
            'average': average,
            'cost': cost,
            'amount': amount,
            'filled': filled,
            'remaining': remaining,
            'status': status,
            'fee': fee,
        };
    }

    getCurrency (obj) {
        if (obj.currency) {
            return obj.currency;
        } else {
            return 'SWT';
        }
    }
};
