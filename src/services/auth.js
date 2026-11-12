const crypto = require('crypto');
const { sendMessage } = require('./twilio');

const OTP_TTL     = 5 * 60 * 1000;       // 5 min
const SESSION_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days

const otps     = new Map(); // userId → { code, expiresAt }
const sessions = new Map(); // token  → { userId, expiresAt }

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `whatsapp:+${withCountry}`;
}

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOTP(rawPhone) {
  const userId = normalizePhone(rawPhone);
  const code   = generateOTP();
  otps.set(userId, { code, expiresAt: Date.now() + OTP_TTL });
  await sendMessage(
    userId,
    `Seu código de acesso ao *Alfred Dashboard*:\n\n` +
    `*${code}*\n\nVálido por 5 minutos. Não compartilhe com ninguém.`
  );
  return userId;
}

function verifyOTP(rawPhone, inputCode) {
  const userId = normalizePhone(rawPhone);
  const entry  = otps.get(userId);
  if (!entry)                       return null;
  if (Date.now() > entry.expiresAt) { otps.delete(userId); return null; }
  if (entry.code !== String(inputCode).trim()) return null;
  otps.delete(userId);
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, { userId, expiresAt: Date.now() + SESSION_TTL });
  return { token, userId };
}

function getSession(token) {
  if (!token) return null;
  const s = sessions.get(token);
  if (!s) return null;
  if (Date.now() > s.expiresAt) { sessions.delete(token); return null; }
  return s;
}

function deleteSession(token) {
  sessions.delete(token);
}

module.exports = { normalizePhone, requestOTP, verifyOTP, getSession, deleteSession };
