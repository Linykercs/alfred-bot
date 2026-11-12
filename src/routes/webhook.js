const express = require('express');
const twilio = require('twilio');
const { classify } = require('../services/claude');
const { sendMessage } = require('../services/twilio');
const storage = require('../services/storage');
const expenseHandler = require('../handlers/expense');
const queryHandler = require('../handlers/query');
const reminderHandler = require('../handlers/reminder');
const logger = require('../utils/logger');

const router = express.Router();

// Users awaiting name input (in-memory — persists between messages, resets on restart)
const awaitingName = new Set();

const FALLBACK = 'Não entendi bem essa.\nPode ser algo tipo:\n"Gastei X em Y" ou "Quanto gastei esse mês?"';

const DASHBOARD_URL = process.env.BASE_URL
  ? process.env.BASE_URL.replace('ngrok-free.app', 'up.railway.app').replace('https://aids-shower-sardine.up.railway.app', 'https://alfred-production-29a6.up.railway.app')
  : 'https://alfred-production-29a6.up.railway.app';

router.post('/', async (req, res) => {
  const signature = req.headers['x-twilio-signature'] || '';
  const url = `${process.env.BASE_URL}/webhook`;

  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    req.body
  );

  if (!valid && process.env.NODE_ENV === 'production') {
    logger.warn('Assinatura Twilio inválida — rejeitando requisição');
    return res.sendStatus(403);
  }

  res.sendStatus(200);

  const userId  = req.body.From;
  const message = (req.body.Body || '').trim();

  if (!userId || !message) return;

  const masked = userId.replace(/\d{4}(?=\D*$)/, '****');
  logger.info(`[webhook] ${masked}: "${message}"`);

  try {
    // ── New user: awaiting name ────────────────────────────────────────────────
    if (awaitingName.has(userId)) {
      awaitingName.delete(userId);
      const nome = message.trim();
      await storage.updateUserName(userId, nome);
      await sendMessage(
        userId,
        `Ótimo, ${nome}! 🎉 Agora é só me mandar seus gastos.\n\n` +
        `Pode mandar assim: _"Gastei 50 no almoço"_ ou _"Quanto gastei esse mês?"_\n\n` +
        `Acesse seu dashboard em:\n${DASHBOARD_URL}`
      );
      return;
    }

    // ── Check if new user ──────────────────────────────────────────────────────
    let user = await storage.getUser(userId);
    if (!user) {
      await storage.saveUser(userId, { nome: '' });
      awaitingName.add(userId);
      await sendMessage(
        userId,
        `Olá! 👋 Bem-vindo ao *Alfred*, seu assistente financeiro pessoal.\n\nQual é o seu nome?`
      );
      return;
    }

    // ── Normal flow ────────────────────────────────────────────────────────────
    const intent = await classify(message);
    logger.info(`[webhook] intent=${intent}`);

    switch (intent) {
      case 'EXPENSE':
        await expenseHandler(userId, message);
        break;
      case 'QUERY':
        await queryHandler(userId, message);
        break;
      case 'REMINDER':
        await reminderHandler(userId, message);
        break;
      case 'CORRECTION':
        await sendMessage(userId, 'Correções em breve! Por enquanto me manda o gasto de novo com os dados certos.');
        break;
      default:
        await sendMessage(userId, FALLBACK);
    }
  } catch (err) {
    logger.error(`[webhook] erro: ${err.message}`);
    await sendMessage(userId, 'Tive um probleminha aqui. Tenta de novo em instantes?');
  }
});

module.exports = router;
