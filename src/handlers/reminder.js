const { extractReminder } = require('../services/claude');
const { sendMessage } = require('../services/twilio');
const storage = require('../services/storage');
const { formatDatetime } = require('../utils/date');
const sessions = require('../utils/sessions');

async function handleListReminders(userId) {
  const reminders = await storage.getReminders(userId);
  if (!reminders.length) {
    await sendMessage(userId, 'Você não tem lembretes ativos.');
    return;
  }
  const lines = reminders.map((r, i) => {
    const when = formatDatetime(r.data_hora);
    const rec  = r.recorrencia !== 'unico' ? ` (${r.recorrencia})` : '';
    return `${i + 1}. ${r.mensagem} — ${when}${rec}`;
  });
  await sendMessage(userId, `Seus lembretes:\n\n${lines.join('\n')}`);
}

async function handleCancelReminder(userId, message) {
  const reminders = await storage.getReminders(userId);
  if (!reminders.length) {
    await sendMessage(userId, 'Você não tem lembretes ativos.');
    return;
  }

  // Tenta encontrar pelo conteúdo da mensagem
  const msg = message.toLowerCase();
  const match = reminders.find(r => msg.includes(r.mensagem.toLowerCase()));

  if (match) {
    await storage.deactivateReminder(match.id);
    await sendMessage(userId, `Lembrete cancelado:\n"${match.mensagem}"`);
  } else {
    // Lista para o usuário escolher
    const lines = reminders.map((r, i) => `${i + 1}. ${r.mensagem}`);
    sessions.set(userId, { state: 'AWAITING_CANCEL_CHOICE', reminders });
    await sendMessage(userId, `Qual lembrete quer cancelar?\n\n${lines.join('\n')}`);
  }
}

async function handleCancelChoice(userId, message, session) {
  const num = parseInt(message.trim(), 10);
  sessions.clear(userId);

  if (isNaN(num) || num < 1 || num > session.reminders.length) {
    await sendMessage(userId, 'Não entendi. Cancelamento ignorado.');
    return;
  }
  const target = session.reminders[num - 1];
  await storage.deactivateReminder(target.id);
  await sendMessage(userId, `Cancelado:\n"${target.mensagem}"`);
}

async function handle(userId, message) {
  const session = sessions.get(userId);

  if (session?.state === 'AWAITING_CANCEL_CHOICE') {
    return handleCancelChoice(userId, message, session);
  }

  const msg = message.toLowerCase();

  // Listar lembretes
  if (/quais.*lembretes|meus lembretes|lista.*lembretes/.test(msg)) {
    return handleListReminders(userId);
  }

  // Cancelar lembrete
  if (/cancela|cancelar|remove|deletar/.test(msg)) {
    return handleCancelReminder(userId, message);
  }

  // Criar lembrete
  const data = await extractReminder(message);

  if (!data) {
    await sendMessage(userId, 'Não consegui entender o lembrete. Tenta assim:\n"Me lembra sexta às 9h de pagar o cartão"');
    return;
  }

  await storage.saveReminder(userId, data);

  const when = formatDatetime(data.data_hora);
  const rec  = data.recorrencia !== 'unico' ? ` (${data.recorrencia})` : '';
  await sendMessage(userId, `Combinado! Vou te avisar ${when}${rec}:\n"${data.mensagem}" ✓`);
}

module.exports = handle;
