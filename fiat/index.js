const exchangeNames = require('./market').exchanges;
const getCoindeskCurrentPrice = require('./get_coindesk_current_price');
const getCoindeskRates = require('./get_coindesk_rates');
const getExchangeRates = require('./get_exchange_rates');
const getPriceChart = require('./get_price_chart');
const marketPairs = require('./market').pairs;

const exchanges = []
  .concat(exchangeNames)
  .concat(exchangeNames.map(n => `${n.charAt(0).toUpperCase()}${n.slice(1)}`));

const pairs = []
  .concat(Object.keys(marketPairs).map(n => n.toUpperCase()))
  .concat(Object.keys(marketPairs).map(n => n.toLowerCase()));

module.exports = {
  exchanges,
  getCoindeskCurrentPrice,
  getCoindeskRates,
  getExchangeRates,
  getPriceChart,
  pairs,
};
