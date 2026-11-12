const { extract } = require('../services/claude');
const { sendMessage } = require('../services/twilio');
const storage = require('../services/storage');
const { today, formatDate } = require('../utils/date');
const { currency } = require('../utils/format');
const sessions = require('../utils/sessions');

async function handlePendingValue(userId, message, session) {
  const value = parseFloat(message.replace(',', '.'));
  if (isNaN(value)) {
    await sendMessage(userId, 'Não entendi o valor. Quanto foi?');
    return;
  }
  const expense = { ...session.pendingExpense, valor: value };
  sessions.clear(userId);
  await storage.saveTransaction(userId, expense);
  await sendMessage(userId, buildConfirmation(expense));
}

async function handlePendingConfirm(userId, message, session) {
  const yes = /^(s(im)?|ok|yes|isso|certo|correto)$/i.test(message.trim());
  if (yes) {
    sessions.clear(userId);
    await storage.saveTransaction(userId, session.pendingExpense);
    await sendMessage(userId, '✓ Salvo!');
  } else {
    sessions.clear(userId);
    await sendMessage(userId, 'Tudo bem, descartei. Me manda de novo como quiser.');
  }
}

async function handle(userId, message) {
  const session = sessions.get(userId);

  if (session?.state === 'AWAITING_VALUE') {
    return handlePendingValue(userId, message, session);
  }
  if (session?.state === 'AWAITING_CONFIRM') {
    return handlePendingConfirm(userId, message, session);
  }

  const data = await extract(message, today());

  if (!data) {
    await sendMessage(userId, 'Tive um probleminha aqui. Tenta de novo em instantes?');
    return;
  }

  if (data.valor === null || data.valor === undefined) {
    sessions.set(userId, { state: 'AWAITING_VALUE', pendingExpense: data });
    await sendMessage(userId, 'Quanto foi o gasto?');
    return;
  }

  if (data.confianca < 0.6) {
    sessions.set(userId, { state: 'AWAITING_CONFIRM', pendingExpense: data });
    await sendMessage(
      userId,
      `Entendi: ${data.descricao} · ${currency(data.valor)} · ${formatDate(data.data)}\nEstá certo?`
    );
    return;
  }

  await storage.saveTransaction(userId, data);
  await sendMessage(userId, buildConfirmation(data));
}

function buildConfirmation(data) {
  return `✓ Anotado!\n${data.categoria} · ${currency(data.valor)} · ${formatDate(data.data)}`;
}

module.exports = handle;
