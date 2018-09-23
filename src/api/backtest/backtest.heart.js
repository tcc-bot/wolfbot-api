const ccxt = require('ccxt')
const moment = require('moment')
const configuracao = require('../../infraestrutura/mongo/models/configuracao.model')
const strategy = require('./backtest.strategies')

async function carregarDados(params) {
  const config = await configuracao.findOne({ 'user.user_id': params.user_id })
  let nome_exchange = config.exchange.toLowerCase()
  exchangeCCXT = new ccxt[nome_exchange]()

  const parMoedas = `${config.target_currency}/${config.base_currency}`
  const tamanhoCandle = config.candle_size
  const configIndicators = config.strategy.indicators

  let tempo = params.date_timestamp

  const candle = await exchangeCCXT.fetchOHLCV(parMoedas, tamanhoCandle, tempo)
  const result = await strategy.loadStrategy(configIndicators, candle)

  return {
    candle: candle,
    result: result
  }
}

module.exports = { carregarDados }