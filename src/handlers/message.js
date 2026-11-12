const { classify }       = require('../services/claude');
const { sendMessage }    = require('../services/whatsapp');
const storage            = require('../services/storage');
const expenseHandler     = require('./expense');
const queryHandler       = require('./query');
const reminderHandler    = require('./reminder');
const logger             = require('../utils/logger');

const awaitingName = new Set();

const FALLBACK = 'Não entendi bem essa.\nPode ser algo tipo:\n"Gastei X em Y" ou "Quanto gastei esse mês?"';
const DASHBOARD_URL = process.env.RAILWAY_PUBLIC_DOMAIN
  ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
  : (process.env.BASE_URL || 'https://alfred-production-29a6.up.railway.app');

async function handle(userId, message) {
  const masked = userId.replace(/\d{4}(?=\D*$)/, '****');
  logger.info(`[msg] ${masked}: "${message}"`);

  // ── Awaiting name ────────────────────────────────────────────────────────────
  if (awaitingName.has(userId)) {
    awaitingName.delete(userId);
    const nome = message.trim();
    await storage.updateUserName(userId, nome);
    await sendMessage(
      userId,
      `Ótimo, ${nome}! 🎉 Agora é só me mandar seus gastos.\n\n` +
      `Exemplos:\n_"Gastei 50 no almoço"_\n_"Quanto gastei esse mês?"_\n\n` +
      `Acesse seu dashboard:\n${DASHBOARD_URL}`
    );
    return;
  }

  // ── New user ─────────────────────────────────────────────────────────────────
  let user = await storage.getUser(userId);
  if (!user) {
    await storage.saveUser(userId, { nome: '' });
    awaitingName.add(userId);
    await sendMessage(userId, `Olá! 👋 Bem-vindo ao *Alfred*, seu assistente financeiro pessoal.\n\nQual é o seu nome?`);
    return;
  }

  // ── Route by intent ──────────────────────────────────────────────────────────
  try {
    const intent = await classify(message);
    logger.info(`[msg] intent=${intent}`);
    switch (intent) {
      case 'EXPENSE':   await expenseHandler(userId, message);  break;
      case 'QUERY':     await queryHandler(userId, message);    break;
      case 'REMINDER':  await reminderHandler(userId, message); break;
      case 'CORRECTION':
        await sendMessage(userId, 'Correções em breve! Por enquanto me manda o gasto de novo com os dados certos.');
        break;
      default:
        await sendMessage(userId, FALLBACK);
    }
  } catch (err) {
    logger.error(`[msg] erro: ${err.message}`);
    await sendMessage(userId, 'Tive um probleminha aqui. Tenta de novo em instantes?');
  }
}

module.exports = handle;
