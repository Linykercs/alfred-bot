# Alfred — Arquitetura técnica

**Versão:** 1.0  
**Data:** Junho 2026

---

## 1. Visão geral da stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Mensageria | Twilio WhatsApp API | Sandbox grátis pra dev, produção via número próprio |
| Backend | Node.js 20 + Express | Ecossistema amplo, SDK Anthropic disponível |
| NLP | Claude API (`claude-sonnet-4-6`) | Extração de entidades financeiras com alta precisão |
| Armazenamento | Google Sheets API v4 | Zero infraestrutura, usuário acessa diretamente |
| Agendamento | node-cron | Leve, sem dependência externa |
| Dashboard | React 18 + Recharts | Componentes de gráfico prontos |
| Hospedagem backend | Railway | Deploy via GitHub, SSL automático, plano gratuito |
| Hospedagem frontend | Vercel | CDN global, deploy automático |

---

## 2. Estrutura de pastas

```
alfred/
├── src/
│   ├── server.js              # Entry point, Express app
│   ├── routes/
│   │   ├── webhook.js         # POST /webhook — recebe mensagens Twilio
│   │   └── dashboard.js       # GET /api/* — endpoints do dashboard
│   ├── services/
│   │   ├── claude.js          # Chamadas à Claude API
│   │   ├── sheets.js          # Leitura e escrita no Google Sheets
│   │   ├── twilio.js          # Envio de mensagens WhatsApp
│   │   └── scheduler.js       # node-cron, gestão de lembretes
│   ├── handlers/
│   │   ├── expense.js         # Fluxo de registro de gasto
│   │   ├── query.js           # Fluxo de consultas e relatórios
│   │   └── reminder.js        # Fluxo de criação de lembretes
│   ├── prompts/
│   │   ├── classify.js        # Prompt de classificação de intenção
│   │   ├── extract.js         # Prompt de extração de dados financeiros
│   │   └── report.js          # Prompt de geração de relatório
│   └── utils/
│       ├── date.js            # Parsing de datas em português
│       ├── format.js          # Formatação de moeda e mensagens
│       └── logger.js          # Winston logger
├── dashboard/                 # App React (subpasta ou repo separado)
│   ├── src/
│   │   ├── App.jsx
│   │   ├── pages/
│   │   │   └── Dashboard.jsx
│   │   └── components/
│   │       ├── SummaryCards.jsx
│   │       ├── CategoryChart.jsx
│   │       ├── TimelineChart.jsx
│   │       └── TransactionList.jsx
│   └── package.json
├── .env.example
├── package.json
└── README.md
```

---

## 3. Variáveis de ambiente

```env
# Twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx

# Google Sheets
GOOGLE_SERVICE_ACCOUNT_EMAIL=alfred@projeto.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms

# App
PORT=3000
NODE_ENV=production
BASE_URL=https://alfred.railway.app
```

---

## 4. Schema do Google Sheets

### Aba: `transacoes`

| Coluna | Campo | Tipo | Exemplo |
|---|---|---|---|
| A | id | string (UUID) | `a3f1c2d4` |
| B | data | date (DD/MM/YYYY) | `08/06/2026` |
| C | descricao | string | `Almoço no restaurante` |
| D | valor | number | `40.00` |
| E | categoria | string | `Alimentação` |
| F | criado_em | datetime | `2026-06-08T14:32:00Z` |
| G | usuario_id | string | `5511999999999` |

### Aba: `lembretes`

| Coluna | Campo | Tipo | Exemplo |
|---|---|---|---|
| A | id | string (UUID) | `b2e3f1a5` |
| B | usuario_id | string | `5511999999999` |
| C | mensagem | string | `Pagar o cartão` |
| D | data_hora | datetime | `2026-06-10T09:00:00Z` |
| E | recorrencia | string | `mensal` / `semanal` / `unico` |
| F | ativo | boolean | `TRUE` |

### Aba: `usuarios`

| Coluna | Campo | Tipo | Exemplo |
|---|---|---|---|
| A | usuario_id | string | `5511999999999` |
| B | nome | string | `Felps` |
| C | sheet_id | string | ID da planilha pessoal |
| D | categorias | JSON string | `["Alimentação","Transporte",...]` |
| E | limites | JSON string | `{"Alimentação":600}` |
| F | criado_em | datetime | `2026-06-01T10:00:00Z` |

---

## 5. Fluxo de dados — registro de gasto

```
1. Twilio recebe mensagem do usuário
2. POST /webhook com body: { From, Body, ... }
3. webhook.js valida assinatura Twilio
4. claude.js chama classify.js → determina intenção
   (EXPENSE | QUERY | REMINDER | OTHER)
5. Se EXPENSE → handlers/expense.js
   a. claude.js chama extract.js → retorna { valor, categoria, data, descricao }
   b. sheets.js → appendRow('transacoes', dados)
   c. twilio.js → sendMessage(confirmação formatada)
6. Se QUERY → handlers/query.js
   a. sheets.js → getRows('transacoes', filtros)
   b. claude.js chama report.js → formata relatório
   c. twilio.js → sendMessage(relatório)
7. Se REMINDER → handlers/reminder.js
   a. claude.js extrai data/hora e mensagem
   b. sheets.js → appendRow('lembretes', dados)
   c. scheduler.js → scheduleJob(data_hora, callback)
   d. twilio.js → sendMessage(confirmação)
```

---

## 6. API do dashboard

| Método | Rota | Descrição |
|---|---|---|
| GET | `/api/summary?month=2026-06` | Resumo do mês: total, por categoria |
| GET | `/api/transactions?month=2026-06` | Lista de transações com filtros |
| GET | `/api/categories` | Categorias do usuário |
| GET | `/api/trends?months=3` | Comparativo dos últimos N meses |

---

## 7. Dependências (package.json)

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "express": "^4.18.0",
    "googleapis": "^140.0.0",
    "node-cron": "^3.0.3",
    "twilio": "^5.3.0",
    "uuid": "^10.0.0",
    "winston": "^3.13.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

---

## 8. Considerações de segurança

- Validar assinatura Twilio em todo webhook (`X-Twilio-Signature`)
- Service account Google com acesso restrito à planilha do projeto
- Variáveis de ambiente nunca commitadas (`.env` no `.gitignore`)
- Rate limiting por `usuario_id`: máximo 30 mensagens/minuto
- Logs sem dados sensíveis (mascarar número de telefone)
