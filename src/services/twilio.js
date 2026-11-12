// Mantido por compatibilidade — redireciona para o serviço WhatsApp (Baileys)
const whatsapp = require('./whatsapp');

async function sendMessage(to, body) {
  return whatsapp.sendMessage(to, body);
}

module.exports = { sendMessage };
