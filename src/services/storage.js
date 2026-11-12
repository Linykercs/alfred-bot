const { v4: uuidv4 } = require('uuid');
const sheets = require('./sheets');
const logger = require('../utils/logger');

const DEFAULT_CATEGORIES = [
  'Alimentação', 'Transporte', 'Moradia', 'Saúde',
  'Lazer', 'Educação', 'Compras', 'Outros',
];

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDisplayDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function toISODate(brDate) {
  const [d, m, y] = brDate.split('/');
  return `${y}-${m}-${d}`;
}

// ── Transactions ──────────────────────────────────────────────────────────────

function rowToTransaction(row) {
  return {
    id:          row[0],
    data:        row[1],              // DD/MM/YYYY
    descricao:   row[2],
    valor:       parseFloat(row[3]),
    categoria:   row[4],
    criado_em:   row[5],
    usuario_id:  row[6],
  };
}

async function saveTransaction(userId, { valor, descricao, categoria, data }) {
  const t = {
    id:         uuidv4().slice(0, 8),
    data:       toDisplayDate(data),
    descricao,
    valor,
    categoria,
    criado_em:  new Date().toISOString(),
    usuario_id: userId,
  };
  await sheets.appendRow('transacoes', [
    t.id, t.data, t.descricao, t.valor, t.categoria, t.criado_em, t.usuario_id,
  ]);
  logger.info(`[storage] transaction ${t.id} saved (${categoria} · ${valor})`);
  return t;
}

async function getTransactions(userId, { startDate, endDate, categoria } = {}) {
  const rows = await sheets.getRows('transacoes');
  return rows
    .map(rowToTransaction)
    .filter(t => {
      if (t.usuario_id !== userId) return false;
      if (startDate || endDate) {
        const iso = toISODate(t.data);
        if (startDate && iso < startDate) return false;
        if (endDate   && iso > endDate)   return false;
      }
      if (categoria && t.categoria !== categoria) return false;
      return true;
    });
}

async function getLastTransaction(userId) {
  const rows = await sheets.getRows('transacoes');
  const userRows = rows.filter(r => r[6] === userId);
  if (!userRows.length) return null;
  return rowToTransaction(userRows[userRows.length - 1]);
}

async function updateTransaction(userId, id, updates) {
  const rows = await sheets.getRows('transacoes');
  const idx = rows.findIndex(r => r[0] === id && r[6] === userId);
  if (idx === -1) return null;
  const current = rowToTransaction(rows[idx]);
  const updated = { ...current, ...updates };
  if (updates.data) updated.data = toDisplayDate(updates.data);
  await sheets.updateRow('transacoes', idx, [
    updated.id, updated.data, updated.descricao, updated.valor,
    updated.categoria, updated.criado_em, updated.usuario_id,
  ]);
  return updated;
}

// ── Reminders ─────────────────────────────────────────────────────────────────

function rowToReminder(row) {
  return {
    id:          row[0],
    usuario_id:  row[1],
    mensagem:    row[2],
    data_hora:   row[3],
    recorrencia: row[4],
    ativo:       row[5] === 'TRUE',
  };
}

async function saveReminder(userId, { mensagem, data_hora, recorrencia = 'unico' }) {
  const r = {
    id:          uuidv4().slice(0, 8),
    usuario_id:  userId,
    mensagem,
    data_hora,
    recorrencia,
    ativo:       'TRUE',
  };
  await sheets.appendRow('lembretes', [
    r.id, r.usuario_id, r.mensagem, r.data_hora, r.recorrencia, r.ativo,
  ]);
  logger.info(`[storage] reminder ${r.id} saved`);
  return r;
}

async function getReminders(userId) {
  const rows = await sheets.getRows('lembretes');
  return rows.map(rowToReminder).filter(r => r.usuario_id === userId && r.ativo);
}

async function getAllActiveReminders() {
  const rows = await sheets.getRows('lembretes');
  return rows.map(rowToReminder).filter(r => r.ativo);
}

async function deactivateReminder(id) {
  const rows = await sheets.getRows('lembretes');
  const idx = rows.findIndex(r => r[0] === id);
  if (idx === -1) return;
  const r = rowToReminder(rows[idx]);
  await sheets.updateRow('lembretes', idx, [
    r.id, r.usuario_id, r.mensagem, r.data_hora, r.recorrencia, 'FALSE',
  ]);
}

async function updateReminderDateTime(id, newDataHora) {
  const rows = await sheets.getRows('lembretes');
  const idx  = rows.findIndex(r => r[0] === id);
  if (idx === -1) return;
  const r = rowToReminder(rows[idx]);
  await sheets.updateRow('lembretes', idx, [
    r.id, r.usuario_id, r.mensagem, newDataHora, r.recorrencia, 'TRUE',
  ]);
}

// ── Users ─────────────────────────────────────────────────────────────────────

function rowToUser(row) {
  return {
    usuario_id:  row[0],
    nome:        row[1],
    sheet_id:    row[2],
    categorias:  JSON.parse(row[3] || '[]'),
    limites:     JSON.parse(row[4] || '{}'),
    criado_em:   row[5],
  };
}

async function getUser(userId) {
  const rows = await sheets.getRows('usuarios');
  const row = rows.find(r => r[0] === userId);
  return row ? rowToUser(row) : null;
}

async function saveUser(userId, { nome, sheet_id = '', categorias = DEFAULT_CATEGORIES, limites = {} }) {
  const u = {
    usuario_id:  userId,
    nome,
    sheet_id,
    categorias:  JSON.stringify(categorias),
    limites:     JSON.stringify(limites),
    criado_em:   new Date().toISOString(),
  };
  await sheets.appendRow('usuarios', [
    u.usuario_id, u.nome, u.sheet_id, u.categorias, u.limites, u.criado_em,
  ]);
  return u;
}

async function updateUserName(userId, nome) {
  const rows = await sheets.getRows('usuarios');
  const idx  = rows.findIndex(r => r[0] === userId);
  if (idx === -1) return;
  const u = rowToUser(rows[idx]);
  await sheets.updateRow('usuarios', idx, [
    u.usuario_id, nome, u.sheet_id,
    JSON.stringify(u.categorias), JSON.stringify(u.limites), u.criado_em,
  ]);
}

module.exports = {
  saveTransaction,
  getTransactions,
  getLastTransaction,
  updateTransaction,
  saveReminder,
  getReminders,
  getAllActiveReminders,
  deactivateReminder,
  updateReminderDateTime,
  getUser,
  saveUser,
  updateUserName,
  DEFAULT_CATEGORIES,
};
