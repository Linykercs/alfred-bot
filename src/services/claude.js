const Groq = require('groq-sdk');
const { CLASSIFY_SYSTEM } = require('../prompts/classify');
const { EXTRACT_SYSTEM } = require('../prompts/extract');
const { REPORT_SYSTEM } = require('../prompts/report');
const { REMINDER_SYSTEM } = require('../prompts/reminder');
const logger = require('../utils/logger');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Os Llama 3.1 8B e 3.3 70B sairam do plano gratuito do Groq em nov/2026 (404
// model_not_found). Os modelos ficam configuraveis para a proxima troca nao exigir deploy
// de codigo.
const MODEL_FAST = process.env.GROQ_MODEL_FAST || 'openai/gpt-oss-20b';
const MODEL_SMART = process.env.GROQ_MODEL_SMART || 'openai/gpt-oss-120b';

// Os gpt-oss raciocinam antes de responder, e esses tokens contam no limite de saida.
// Com esforco baixo e folga no limite, a resposta nao chega cortada.
const REASONING = { reasoning_effort: 'low' };

function stripCodeFence(text) {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
}

async function classify(message) {
  const response = await client.chat.completions.create({
    model: MODEL_FAST,
    ...REASONING,
    max_tokens: 512,
    messages: [
      { role: 'system', content: CLASSIFY_SYSTEM },
      { role: 'user', content: message },
    ],
  });
  const intent = response.choices[0].message.content.trim().toUpperCase();
  const valid = ['EXPENSE', 'QUERY', 'REMINDER', 'CORRECTION', 'OTHER'];
  return valid.includes(intent) ? intent : 'OTHER';
}

async function extract(message, dateToday) {
  const system = EXTRACT_SYSTEM.replace(/{DATA_HOJE}/g, dateToday);

  const response = await client.chat.completions.create({
    model: MODEL_SMART,
    ...REASONING,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: message },
    ],
  });

  const text = stripCodeFence(response.choices[0].message.content.trim());
  try {
    return JSON.parse(text);
  } catch {
    logger.error(`extract: JSON inválido — ${text}`);
    return null;
  }
}

async function report(data) {
  const response = await client.chat.completions.create({
    model: MODEL_SMART,
    ...REASONING,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: REPORT_SYSTEM },
      { role: 'user', content: JSON.stringify(data) },
    ],
  });
  return response.choices[0].message.content.trim();
}

async function extractReminder(message) {
  const now    = new Date().toISOString();
  const system = REMINDER_SYSTEM.replace(/{DATETIME_AGORA}/g, now);

  const response = await client.chat.completions.create({
    model: MODEL_SMART,
    ...REASONING,
    max_tokens: 1024,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: message },
    ],
  });

  const text = stripCodeFence(response.choices[0].message.content.trim());
  try {
    return JSON.parse(text);
  } catch {
    logger.error(`extractReminder: JSON inválido — ${text}`);
    return null;
  }
}

module.exports = { classify, extract, extractReminder, report };
