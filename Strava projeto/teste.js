// Importando as bibliotecas necessárias
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const pd = require('pandas-js');

// Definindo as variáveis de URL
const b3_url = 'http://www.b3.com.br/pt_br/market-data-e-indices/servicos-de-dados/market-data/consultas/mercado-a-vista/cotacoes-historicas/';
const dolar_url = 'https://www.valor.com.br/valor-data/cotacoes';

// Definindo as funções que obtém os dados da B3 e do Valor
async function getB3Data(stock) {
  const response = await fetch(`${b3_url}?codigo=${stock}`);
  const html = await response.text();
  const $ = cheerio.load(html);
  const rows = $('table tbody tr');
  const data = [];
  rows.each((index, element) => {
    const tds = $(element).find('td');
    const date = $(tds[0]).text();
    const open = parseFloat($(tds[1]).text().replace(',', '.'));
    const close = parseFloat($(tds[4]).text().replace(',', '.'));
    data.push([date, close - open]);
  });
  const df = new pd.DataFrame(data, {columns: ['date', 'variation']});
  return df;
}

async function getDolarData() {
  const response = await fetch(dolar_url);
  const html = await response.text();
  const $ = cheerio.load(html);
  const rows = $('table tbody tr');
  const data = [];
  rows.each((index, element) => {
    const tds = $(element).find('td');
    const date = $(tds[0]).text();
    const rate = parseFloat($(tds[1]).text().replace(',', '.'));
    data.push([date, rate]);
  });
  const df = new pd.DataFrame(data, {columns: ['date', 'rate']});
  return df;
}

// Definindo a função que calcula o coeficiente de correlação
function calculateCorrelationCoefficient(dataframes) {
  const merged = pd.concat(dataframes, {axis: 1, join: 'inner'});
  const corr = merged.corr();
  return corr['variation']['rate'];
}

// Definindo as ações e chamando as funções para executar a análise
(async () => {
  const stocks = ['ABEV3', 'ITSA4', 'PETR4', 'VALE3'];
  const stockData = await Promise.all(stocks.map(stock => getB3Data(stock)));
  const dolarData = await getDolarData();
  const coefficient = calculateCorrelationCoefficient([...stockData, dolarData]);
  console.log(`Coeficiente de correlação: ${coefficient}`);
})();