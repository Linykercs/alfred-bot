require('dotenv').config();
const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;

const TABS = [
  {
    name: 'transacoes',
    headers: ['id', 'data', 'descricao', 'valor', 'categoria', 'criado_em', 'usuario_id'],
  },
  {
    name: 'lembretes',
    headers: ['id', 'usuario_id', 'mensagem', 'data_hora', 'recorrencia', 'ativo'],
  },
  {
    name: 'usuarios',
    headers: ['usuario_id', 'nome', 'sheet_id', 'categorias', 'limites', 'criado_em'],
  },
];

async function main() {
  if (!SPREADSHEET_ID) {
    console.error('❌  GOOGLE_SPREADSHEET_ID não definido no .env');
    process.exit(1);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY_B64
        ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
        : (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  // Busca abas existentes
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existing = meta.data.sheets.map(s => s.properties.title);
  console.log(`\nPlanilha: ${meta.data.properties.title}`);
  console.log(`Abas existentes: ${existing.join(', ') || '(nenhuma)'}\n`);

  for (const tab of TABS) {
    if (!existing.includes(tab.name)) {
      // Cria a aba
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: tab.name } } }],
        },
      });
      console.log(`✓ Aba "${tab.name}" criada`);
    } else {
      console.log(`→ Aba "${tab.name}" já existe`);
    }

    // Verifica se cabeçalho já está na linha 1
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${tab.name}!A1:Z1`,
    });
    const firstRow = (res.data.values || [])[0] || [];

    if (firstRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${tab.name}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [tab.headers] },
      });
      console.log(`  ↳ Cabeçalho adicionado: ${tab.headers.join(', ')}`);
    } else {
      console.log(`  ↳ Cabeçalho já presente: ${firstRow.join(', ')}`);
    }
  }

  console.log('\n✅  Setup concluído. Planilha pronta para uso.\n');
}

main().catch(err => {
  console.error('❌  Erro:', err.message);
  process.exit(1);
});
