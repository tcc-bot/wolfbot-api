const lodash = require('lodash')
const tulind = require('tulind')
const moment = require('moment')

function loadStrategy(config, candle, market) {

  const ordersBuy = []
  const ordersSell = []
  const sellForIndicator = false
  const profit = config.profit
  const stop = config.stop
  const fee = market.taker
  const timestamp = []
  const open = []
  const high = []
  const low = []
  const close = []
  const volume = []

  let signalBUY = []
  let signalSELL = []
  let contOrdersOpen = 0
  let numberOrdersBuy = 0
  let numberOrdersSell = 0
  let price = 0
  let time = moment
  time.locale('pt-br')

  lodash.flatten(candle.map(function (value) {
    return value.filter(function (value2, index2) {
      if (index2 === 0) {
        timestamp.push(value2)
      }
      if (index2 === 1) {
        open.push(value2)
      }
      if (index2 === 2) {
        high.push(value2)
      }
      if (index2 === 3) {
        low.push(value2)
      }
      if (index2 === 4) {
        close.push(value2)
      }
      if (index2 === 5) {
        volume.push(value2)
      }
    })
  }))

  function criarOrdemCompra(preco, timeCompra, profit, candlePosition) {
    ordersBuy.push({
      candle: candlePosition,
      tipoOrdem: 'COMPRA',
      status: 'aberta',
      precoComprado: preco,
      fee: fee,
      horaCompra: timeCompra.format('LLL'),
      target: profit,
      ordemCompraNumero: ++numberOrdersBuy
    })
  }

  function criarOrdemVenda(preco, precoComprado, timeVenda, timeCompra) {
    ordersSell.push({
      tipoOrdem: 'VENDA',
      status: 'fechada',
      precoComprado: precoComprado,
      horaCompra: timeCompra,
      precoVendido: preco,
      fee: fee,
      lucroObtido: preco - precoComprado - (preco * 0.005),
      percentualGanho: (preco - precoComprado - (preco * 0.005)) / preco,
      horaVenda: timeVenda.format('LLL'),
      ordemVendaNumero: ++numberOrdersSell
    })
  }

  if (config.indicator.name === 'EMA') {
    const period = config.ema.period
    tulind.indicators.ema.indicator([close], [period], function (err, result) {
      if (err) {
        console.log(err)
      } else {
        const arrayEMA = result[0]
        const tendencia = {
          up: 2,
          down: -2,
          persistence: 2
        }
        let cont2 = 0


        //LÓGICA PARA ENVIO DE SINAL DE COMPRA E VENDA COM INDICADOR
        for (let i = period - 1; i <= close.length - 1; i++) {
          let ema = parseFloat(arrayEMA[cont2])
          let tendenciaUP = ema + tendencia.up
          let tendenciaDOWN = ema + tendencia.down
          cont2++

          if (close[i] < ema) {
            if (close[i] < tendenciaDOWN && close[i] > (tendenciaDOWN - tendencia.persistence)) {
              signalBUY.push({
                candle: i,
                indicator: 'EMA'
              })
            }
          } else if (close[i] > ema) {
            if (sellForIndicator === true) {
              if ((close[i] > tendenciaUP && close[i] < (tendenciaUP + tendencia.persistence))) {
                signalSELL.push({
                  candle: i,
                  indicator: 'EMA'
                })
              }
            }
          }
        }
      }
    })
  }

  if (config.indicator.name === 'MACD') {
    const shortPeriod = config.indicator.short_period
    const longPeriod = config.indicator.long_period
    const signalPeriod = config.indicator.signal_period

    tulind.indicators.macd.indicator([close], [shortPeriod, longPeriod, signalPeriod], function (err, result) {
      if (err) {
        console.log(err)
      } else {
        const arrayMacd = result[0]
        const arrayHistograma = result[2]
        const tendencia = {
          up: 1,
          down: -1,
          persistence: 1
        }
        let cont2 = 0

        //LÓGICA PARA ENVIO DE SINAL DE COMPRA E VENDA COM INDICADOR
        for (let i = longPeriod + 1; i <= candle.length - 1; i++) {
          let macd = parseFloat(arrayMacd[cont2])
          let histograma = parseFloat(arrayHistograma[cont2])
          cont2++

          if (macd < 0) {
            if (histograma > tendencia.up && histograma < (tendencia.up + tendencia.persistence) && close[i] >= close[i - 1]) {
              signalBUY.push({
                candle: i,
                indicator: 'MACD'
              })
            }
          } else if (macd > 0) {
            if ((histograma < tendencia.down && histograma > (tendencia.down - tendencia.persistence))) {
              signalSELL.push({
                candle: i,
                indicator: 'MACD'
              })
            }
          }
        }
      }
    })
  }

  if (config.indicator.name === 'RSI') {
    tulind.indicators.rsi.indicator([close], [config.rsi.period], function (err, result) {
      if (err) {
        console.log(err)
      } else {
        console.log('Resultado RSI')
        console.log(result[0])
      }
    })
  }

  for (let i = 0; i <= candle.length - 1; i++) {
    for (let j = 0; j <= signalBUY.length - 1; j++) {
      if (signalBUY[j].candle === i) {
        let preco = parseFloat(candle[i][4])
        let time = moment(candle[i][0])
        ordersBuy.push({
          candle: i,
          tipoOrdem: 'COMPRA',
          status: 'aberta',
          precoComprado: preco,
          close: close[i],
          horaCompra: time.format('LLL'),
          target: profit,
          ordemCompraNumero: ++numberOrdersBuy
        })
      }
    }
    if (sellForIndicator === true) {
      for (let k = 0; k <= signalSELL.length - 1; k++) {
        if (signalSELL[k].candle === i) {
          for (let x = 0; x <= ordersBuy.length; x++) {
            if (ordersBuy[x].status === 'aberta') {
              let preco = parseFloat(candle[i][4])
              let time = moment(candle[i][0])
              ordersSell.push({
                tipoOrdem: 'VENDA',
                status: 'fechada',
                precoComprado: ordersBuy[x].precoComprado,
                horaCompra: ordersBuy[x].horaCompra,
                precoVendido: preco,
                lucroObtido: preco - precoComprado - (preco * (2 * parseFloat(fee))),
                percentualGanho: (preco - precoComprado - (preco * (2 * parseFloat(fee)))) / preco,
                horaVenda: time.format('LLL'),
                ordemVendaNumero: ++numberOrdersSell
              })
            }
          }
        }
      }
    } else {
      for (let x = 0; x <= ordersBuy.length - 1; x++) {
        if (ordersBuy[x].status === 'aberta') {
          let preco = parseFloat(candle[i][4])
          let time = moment(candle[i][0])
          if (preco >= ordersBuy[x].precoComprado + (ordersBuy[x].precoComprado * profit)) {
            ordersBuy[x].status = 'fechada'
            ordersSell.push({
              tipoOrdem: 'VENDA',
              status: 'fechada',
              precoComprado: ordersBuy[x].precoComprado,
              horaCompra: ordersBuy[x].horaCompra,
              precoVendido: preco,
              lucroObtido: preco - ordersBuy[x].precoComprado - (preco * (2 * parseFloat(fee))),
              percentualGanho: (preco - ordersBuy[x].precoComprado - (preco * (2 * parseFloat(fee)))) / preco,
              horaVenda: time.format('LLL'),
              ordemVendaNumero: ++numberOrdersSell
            })
          } else if (preco <= ordersBuy[x].precoComprado - (ordersBuy[x].precoComprado * stop)) {
            ordersBuy[x].status = 'fechada'
            ordersSell.push({
              tipoOrdem: 'VENDA',
              status: 'fechada',
              precoComprado: ordersBuy[x].precoComprado,
              horaCompra: ordersBuy[x].horaCompra,
              precoVendido: preco,
              lucroObtido: preco - ordersBuy[x].precoComprado - (preco * (2 * parseFloat(fee))),
              percentualGanho: (preco - ordersBuy[x].precoComprado - (preco * (2 * parseFloat(fee)))) / preco,
              horaVenda: time.format('LLL'),
              ordemVendaNumero: ++numberOrdersSell
            })
          }
        }
      }
    }
  }

  return {
    result: 'teste'
  }
}

module.exports = { loadStrategy }
