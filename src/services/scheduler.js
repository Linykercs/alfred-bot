const cron = require('node-cron');
const storage = require('./storage');
const { sendMessage } = require('./twilio');
const logger = require('../utils/logger');

// Avança data_hora para a próxima ocorrência após disparar
function nextOccurrence(isoString, recorrencia) {
  const d = new Date(isoString);
  switch (recorrencia) {
    case 'diario':  d.setDate(d.getDate() + 1);    break;
    case 'semanal': d.setDate(d.getDate() + 7);    break;
    case 'mensal':  d.setMonth(d.getMonth() + 1);  break;
  }
  return d.toISOString();
}

async function checkDueReminders() {
  let reminders;
  try {
    reminders = await storage.getAllActiveReminders();
  } catch (err) {
    logger.error(`[scheduler] erro ao buscar lembretes: ${err.message}`);
    return;
  }

  const now = Date.now();

  for (const r of reminders) {
    if (new Date(r.data_hora).getTime() > now) continue;

    try {
      await sendMessage(r.usuario_id, `Lembrete ⏰\n${r.mensagem}`);
      logger.info(`[scheduler] lembrete ${r.id} disparado para ${r.usuario_id}`);

      if (r.recorrencia === 'unico') {
        await storage.deactivateReminder(r.id);
      } else {
        const next = nextOccurrence(r.data_hora, r.recorrencia);
        await storage.updateReminderDateTime(r.id, next);
        logger.info(`[scheduler] lembrete ${r.id} reagendado para ${next}`);
      }
    } catch (err) {
      logger.error(`[scheduler] erro ao disparar lembrete ${r.id}: ${err.message}`);
    }
  }
}

function start() {
  // Verifica lembretes vencidos a cada minuto
  cron.schedule('* * * * *', checkDueReminders, {
    timezone: 'America/Sao_Paulo',
  });

  // Resumo semanal — toda segunda às 8h (stub: Etapa proativo)
  cron.schedule('0 8 * * 1', async () => {
    logger.info('[scheduler] resumo semanal — TODO');
  }, { timezone: 'America/Sao_Paulo' });

  // Resumo mensal — dia 1 às 9h (stub: Etapa proativo)
  cron.schedule('0 9 1 * *', async () => {
    logger.info('[scheduler] resumo mensal — TODO');
  }, { timezone: 'America/Sao_Paulo' });

  logger.info('[scheduler] iniciado');
}

module.exports = { start, checkDueReminders };
