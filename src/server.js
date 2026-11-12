'use strict';
require('dotenv').config();
const express   = require('express');
const path      = require('path');
const QRCode    = require('qrcode');
const whatsapp  = require('./services/whatsapp');
const messageHandler = require('./handlers/message');
const dashboardRouter = require('./routes/dashboard');
const scheduler = require('./services/scheduler');
const logger    = require('./utils/logger');

const app  = express();
const PORT = process.env.PORT || 3000;

// Dev CORS
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    next();
  });
}

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// ── QR code endpoint ────────────────────────────────────────────────────────
// POST /pair  { phone: "5511999999999" }
app.post('/pair', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone obrigatório' });
  try {
    const code = await whatsapp.requestPairingCode(phone.replace(/\D/g, ''));
    res.json({ code });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/qr', async (_req, res) => {
  const qr          = whatsapp.getQR();
  const connected   = whatsapp.isConnected();

  const shell = (content) => `<!DOCTYPE html>
<html lang="pt-BR" data-theme="dark">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Alfred · WhatsApp</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..700&display=swap" rel="stylesheet"/>
  <style>
    :root{--bg:#0B0C0D;--surface:#141618;--border:#24282D;--text:#F3F5F6;--text-2:#9CA3AB;--text-3:#686F77;--green:#34D399;--green-soft:color-mix(in srgb,var(--green) 14%,transparent);--r-lg:14px;--r-xl:20px;}
    *{box-sizing:border-box;margin:0}
    body{font-family:'Inter',-apple-system,sans-serif;background:var(--bg);color:var(--text);min-height:100vh;display:grid;place-items:center;padding:24px;-webkit-font-smoothing:antialiased;}
    .card{background:var(--surface);border:1px solid var(--border);border-radius:var(--r-xl);padding:40px 36px;width:100%;max-width:400px;display:flex;flex-direction:column;align-items:center;gap:24px;text-align:center;}
    .logo{width:48px;height:48px;border-radius:12px;background:var(--green);display:grid;place-items:center;}
    .logo svg{width:27px;height:27px;}
    h1{font-size:20px;font-weight:640;letter-spacing:-.02em;}
    p{font-size:13px;color:var(--text-2);line-height:1.5;}
    .qr-wrap{background:#fff;border-radius:12px;padding:14px;width:220px;height:220px;display:grid;place-items:center;}
    .qr-wrap svg{width:192px;height:192px;}
    .steps{display:flex;flex-direction:column;gap:8px;width:100%;text-align:left;}
    .step{display:flex;align-items:center;gap:10px;font-size:13px;color:var(--text-2);}
    .step-num{width:22px;height:22px;border-radius:50%;background:var(--green-soft);color:var(--green);font-size:11px;font-weight:640;display:grid;place-items:center;flex:none;}
    .badge{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;border-radius:999px;font-size:13px;font-weight:560;}
    .badge-ok{background:var(--green-soft);color:var(--green);}
    .badge-wait{background:color-mix(in srgb,#9CA3AB 12%,transparent);color:var(--text-2);}
    .dot{width:8px;height:8px;border-radius:50%;}
    .dot-ok{background:var(--green);box-shadow:0 0 0 3px color-mix(in srgb,var(--green) 25%,transparent);}
    .dot-wait{background:var(--text-3);}
    .timer{font-size:11px;color:var(--text-3);margin-top:-12px;}
    .credits{font-size:11px;color:var(--text-3);margin-top:4px;}
    .tabs{display:flex;gap:8px;width:100%;}
    .tab{flex:1;padding:8px;border-radius:8px;border:1px solid var(--border);background:transparent;color:var(--text-2);font-size:13px;font-weight:540;cursor:pointer;}
    .tab.active{background:var(--green-soft);color:var(--green);border-color:transparent;}
    .pair-form{display:flex;gap:8px;width:100%;}
    .pair-form input{flex:1;padding:10px 12px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:14px;font-family:inherit;}
    .pair-form button{padding:10px 16px;border-radius:8px;border:none;background:var(--green);color:#07140E;font-weight:600;font-size:13px;cursor:pointer;white-space:nowrap;}
    .pair-code{font-size:32px;font-weight:700;letter-spacing:.15em;color:var(--green);background:var(--green-soft);padding:16px 24px;border-radius:10px;}
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <svg viewBox="0 0 24 24" fill="none">
        <path d="M5.5 19 12 4.5 18.5 19" stroke="#07140E" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M8.7 13.4H15.3" stroke="#07140E" stroke-width="2.4" stroke-linecap="round"/>
      </svg>
    </div>
    ${content}
    <span class="credits">Desenvolvido por Linyker Mendes &amp; Felipe Gandour</span>
  </div>
</body>
</html>`;

  if (connected) {
    return res.send(shell(`
      <h1>WhatsApp conectado</h1>
      <div class="badge badge-ok"><span class="dot dot-ok"></span>Online e funcionando</div>
      <p>O Alfred está ativo e recebendo mensagens.<br/>Qualquer pessoa pode mandar mensagem agora.</p>
    `));
  }

  if (!qr) {
    return res.send(shell(`
      <h1>Iniciando conexão…</h1>
      <div class="badge badge-wait"><span class="dot dot-wait"></span>Gerando QR code</div>
      <p>Aguarde alguns segundos e recarregue a página.</p>
      <span class="timer">Recarregando automaticamente…</span>
      <script>setTimeout(()=>location.reload(),3000)</script>
    `));
  }

  const svg = await QRCode.toString(qr, { type: 'svg', margin: 1, width: 192 });
  return res.send(shell(`
    <h1>Conectar WhatsApp</h1>

    <div class="tabs">
      <button class="tab active" onclick="show('pair')">Código (recomendado)</button>
      <button class="tab" onclick="show('qr')">QR Code</button>
    </div>

    <div id="tab-pair">
      <p>Digite seu número e copie o código no WhatsApp.</p>
      <div class="pair-form">
        <input id="phone-input" type="tel" placeholder="5511999999999" inputmode="numeric"/>
        <button onclick="getCode()">Gerar código</button>
      </div>
      <div id="pair-result" style="display:none">
        <div class="pair-code" id="pair-code"></div>
        <p style="font-size:12px;margin-top:8px">WhatsApp → Aparelhos Conectados → <b>Vincular com número de telefone</b></p>
      </div>
      <div class="steps" style="margin-top:16px">
        <div class="step"><span class="step-num">1</span>Digite seu número acima e clique em Gerar</div>
        <div class="step"><span class="step-num">2</span>Abra WhatsApp → <b>Aparelhos Conectados</b></div>
        <div class="step"><span class="step-num">3</span>Toque em <b>Vincular com número de telefone</b></div>
        <div class="step"><span class="step-num">4</span>Digite o código gerado</div>
      </div>
    </div>

    <div id="tab-qr" style="display:none">
      <div class="qr-wrap">${svg}</div>
      <div class="steps">
        <div class="step"><span class="step-num">1</span>Abra o WhatsApp no celular</div>
        <div class="step"><span class="step-num">2</span>Toque em <b>Aparelhos conectados</b></div>
        <div class="step"><span class="step-num">3</span>Toque em <b>Conectar aparelho</b></div>
        <div class="step"><span class="step-num">4</span>Aponte a câmera para o QR</div>
      </div>
      <span class="timer">QR expira em 60s — recarrega automaticamente</span>
    </div>

    <script>
      function show(tab) {
        document.getElementById('tab-pair').style.display = tab==='pair' ? '' : 'none';
        document.getElementById('tab-qr').style.display   = tab==='qr'   ? '' : 'none';
        document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active', (i===0&&tab==='pair')||(i===1&&tab==='qr')));
      }
      async function getCode() {
        const phone = document.getElementById('phone-input').value.replace(/\\D/g,'');
        if (!phone) return;
        const btn = document.querySelector('#tab-pair button');
        btn.textContent = 'Gerando...'; btn.disabled = true;
        try {
          const r = await fetch('/pair', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
          const d = await r.json();
          if (d.code) {
            document.getElementById('pair-code').textContent = d.code;
            document.getElementById('pair-result').style.display = '';
          } else {
            alert(d.error || 'Erro ao gerar código');
          }
        } catch(e) { alert('Erro: ' + e.message); }
        btn.textContent = 'Gerar código'; btn.disabled = false;
      }
    </script>
    <script>setTimeout(()=>location.reload(),30000)</script>
  `));
});

// ── API ──────────────────────────────────────────────────────────────────────
app.use('/api', dashboardRouter);
app.get('/health', (_req, res) => res.json({ status: 'ok', wa: whatsapp.isConnected() }));

// ── Static dashboard ─────────────────────────────────────────────────────────
const DIST = path.join(__dirname, '../dashboard/dist');
app.use(express.static(DIST));
app.get('*', (req, res) => {
  res.sendFile(path.join(DIST, 'index.html'), err => {
    if (err) res.status(404).json({ error: 'Not found' });
  });
});

// ── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  logger.info(`Alfred rodando na porta ${PORT} [${process.env.NODE_ENV}]`);
  scheduler.start();
  whatsapp.start(messageHandler).catch(e => logger.error(`[wa] init error: ${e.message}`));
});
