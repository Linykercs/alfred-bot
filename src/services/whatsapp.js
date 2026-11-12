const path    = require('path');
const logger  = require('../utils/logger');
const { wrapSocket, getStealthSocketConfig, rampPresenceAfterConnect } = require('baileys-antiban');

let _sendMessage = null;
let _sock        = null;
let _qr          = null;
let _connected   = false;

function jidToUserId(jid) {
  const num = jid.split('@')[0];
  if (jid.endsWith('@lid')) return `whatsapp:lid:${num}`;
  return `whatsapp:+${num}`;
}

function userIdToJid(userId) {
  if (userId.startsWith('whatsapp:lid:')) return userId.replace('whatsapp:lid:', '') + '@lid';
  return userId.replace('whatsapp:+', '') + '@s.whatsapp.net';
}

async function start(onMessage) {
  const {
    default: makeWASocket,
    DisconnectReason,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
  } = await import('@whiskeysockets/baileys');
  const pino = (await import('pino')).default;

  const SESSION_DIR = process.env.SESSION_DIR || path.join(process.cwd(), 'wa-session');
  const { state, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  function connect() {
    const stealthConfig = getStealthSocketConfig(); // random browser fingerprint
    const sock = makeWASocket({
      version,
      auth:            state,
      printQRInTerminal: true,
      logger:          pino({ level: 'silent' }),
      syncFullHistory: false,
      generateHighQualityLinkPreview: false,
      getMessage:      async () => ({ conversation: '' }),
      ...stealthConfig, // markOnlineOnConnect: false + random browser
    });
    _sock = sock;
    const safeSock = wrapSocket(sock, {
      maxPerMinute: 8,
      maxPerHour:   200,
      minDelayMs:   1500,
      maxDelayMs:   4000,
    });

    sock.ev.on('creds.update', saveCreds);

    const ac = new AbortController();

    sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        _qr = qr;
        logger.info('[wa] QR gerado — acesse /qr para escanear');
      }
      if (connection === 'close') {
        _connected   = false;
        _sendMessage = null;
        ac.abort();
        const code = lastDisconnect?.error?.output?.statusCode;
        if (code !== DisconnectReason.loggedOut) {
          logger.info('[wa] reconectando...');
          setTimeout(connect, 3000);
        } else {
          logger.warn('[wa] deslogado — delete wa-session/ e reinicie');
        }
      } else if (connection === 'open') {
        _qr        = null;
        _connected = true;
        // Only assign _sendMessage once fully authenticated so callers don't
        // try to send on an unauthenticated socket (causes Baileys TypeError)
        _sendMessage = async (userId, text) => {
          const jid = userIdToJid(userId);
          await safeSock.sendMessage(jid, { text });
        };
        logger.info('[wa] conectado ✓');
        rampPresenceAfterConnect(sock, { minDelayMs: 30000, maxDelayMs: 90000, signal: ac.signal })
          .catch(() => {});
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const msg of messages) {
        if (msg.key.fromMe) continue;
        const jid = msg.key.remoteJid || '';
        // accept @s.whatsapp.net (normal) and @lid (linked-device privacy format)
        if (!jid.endsWith('@s.whatsapp.net') && !jid.endsWith('@lid')) continue;
        const text =
          msg.message?.conversation ||
          msg.message?.extendedTextMessage?.text ||
          msg.message?.imageMessage?.caption ||
          '';
        if (!text.trim()) continue;
        const userId = jidToUserId(jid);
        try { await onMessage(userId, text.trim()); }
        catch (e) { logger.error(`[wa] handler error: ${e.message}`); }
      }
    });
  }

  connect();
}

async function requestPairingCode(phone) {
  if (!_sock) throw new Error('WhatsApp não iniciado ainda — aguarde alguns segundos');
  if (_connected) throw new Error('WhatsApp já está conectado');
  // _qr being set means the WS handshake with WhatsApp completed and the socket
  // is waiting for auth — required before requestPairingCode will succeed
  if (!_qr) throw new Error('Socket ainda não pronto — aguarde 5 segundos e tente novamente');
  const fullPhone = phone.startsWith('55') ? phone : `55${phone}`;
  return _sock.requestPairingCode(fullPhone);
}

async function sendMessage(userId, text) {
  if (!_sendMessage) {
    throw new Error('WhatsApp não conectado — aguarde alguns segundos e tente novamente');
  }
  await _sendMessage(userId, text);
}

function getQR()       { return _qr; }
function isConnected() { return _connected; }

module.exports = { start, sendMessage, getQR, isConnected, requestPairingCode };
