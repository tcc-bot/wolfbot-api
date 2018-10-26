const ccxt = require('ccxt')
const moment = require('moment')
const robo = require('set-interval')
const strategy = require('./bot.strategies')
const configuracao = require('../../infraestrutura/mongo/models/configuracao.model')
const _ = require('lodash')

async function roboLigado(params) {
  const config = await configuracao.findOne({ 'user.user_id': params.user_id })

  console.log('########## Robo Ligado ##########')
  acionarMonitoramento(config)
}

function roboDesligado(params) {
  console.log('########## Robo Desligado ##########')
  robo.clear(params.key)
}

async function acionarMonitoramento(config) {

  let nome_exchange = config.exchange.toLowerCase()
  exchangeCCXT = new ccxt[nome_exchange]()
  let periodo = ''
  const unidadeTempo = config.candle_size.substr(-1)
  const unidadeTamanho = Number.parseInt(config.candle_size.substr(0))
  const tamanhoCandle = config.candle_size
  const arrayCurrencies = config.target_currency

  if (unidadeTempo === 'm') {
    periodo = 'minutes'
  } else if (unidadeTempo === 'h') {
    periodo = 'hours'
  } else {
    periodo = 'days'
  }
  const tempo = moment().subtract(100 * unidadeTamanho, periodo)
  let sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))
  robo.start(
    async function load() {
      await sleep(exchangeCCXT.rateLimit) // milliseconds
      for (let i = 0; i <= arrayCurrencies.length - 1; i++) {
        let parMoedas = `${arrayCurrencies[i].currency}/${config.base_currency}`
        let candle = await exchangeCCXT.fetchOHLCV(parMoedas, tamanhoCandle, since = tempo.format('x'), limit = 1000)
        await strategy.loadStrategy(config, arrayCurrencies[i].currency, candle)
      }
    }, config.status.interval_check, config.status.key
  )
}

module.exports = { roboLigado, roboDesligado }