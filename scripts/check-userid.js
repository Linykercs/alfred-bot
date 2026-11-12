require('dotenv').config();
const sheets = require('../src/services/sheets');

async function main() {
  const rows = await sheets.getRows('transacoes');
  if (!rows.length) { console.log('Nenhuma transação na planilha'); return; }
  const ids = [...new Set(rows.map(r => r[6]))];
  console.log('userIds encontrados:');
  ids.forEach(id => console.log(' ', JSON.stringify(id)));
  console.log('\nÚltimas 3 transações:');
  rows.slice(-3).forEach(r => console.log(' ', r));
}

main().catch(e => console.error(e.message));
