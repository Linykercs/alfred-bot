const { google } = require('googleapis');
const logger = require('../utils/logger');

let _sheets = null;

function getSheets() {
  if (_sheets) return _sheets;
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY_B64
        ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_B64, 'base64').toString('utf8')
        : (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  _sheets = google.sheets({ version: 'v4', auth });
  return _sheets;
}

function spreadsheetId() {
  return process.env.GOOGLE_SPREADSHEET_ID;
}

async function appendRow(tab, values) {
  const sheets = getSheets();
  await sheets.spreadsheets.values.append({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
  logger.debug(`[sheets] appendRow → ${tab}`);
}

// Retorna linhas a partir da linha 2 (pula cabeçalho)
async function getRows(tab) {
  const sheets = getSheets();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A2:Z`,
  });
  return res.data.values || [];
}

// rowIndex = índice 0-based do array retornado por getRows (linha 2 da planilha = índice 0)
async function updateRow(tab, rowIndex, values) {
  const sheets = getSheets();
  const sheetRow = rowIndex + 2;
  await sheets.spreadsheets.values.update({
    spreadsheetId: spreadsheetId(),
    range: `${tab}!A${sheetRow}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
  logger.debug(`[sheets] updateRow → ${tab} linha ${sheetRow}`);
}

module.exports = { appendRow, getRows, updateRow };
