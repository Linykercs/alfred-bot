const Groq = require('groq-sdk');
const { CLASSIFY_SYSTEM } = require('../prompts/classify');
const { EXTRACT_SYSTEM } = require('../prompts/extract');
const { REPORT_SYSTEM } = require('../prompts/report');
const { REMINDER_SYSTEM } = require('../prompts/reminder');
const logger = require('../utils/logger');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MODEL_FAST = 'llama-3.1-8b-instant';
const MODEL_SMART = 'llama-3.3-70b-versatile';

async function classify(message) {
  const response = await client.chat.completions.create({
    model: MODEL_FAST,
    max_tokens: 10,
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
    max_tokens: 300,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: message },
    ],
  });

  const text = response.choices[0].message.content.trim();
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
    max_tokens: 500,
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
    max_tokens: 200,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: message },
    ],
  });

  const text = response.choices[0].message.content.trim();
  try {
    return JSON.parse(text);
  } catch {
    logger.error(`extractReminder: JSON inválido — ${text}`);
    return null;
  }
}

module.exports = { classify, extract, extractReminder, report };
