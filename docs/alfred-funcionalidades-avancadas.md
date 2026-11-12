# Alfred — Funcionalidades avançadas

**Versão:** 1.0  
**Data:** Junho 2026

---

## 1. Bot proativo

### 1.1 Resumo automático semanal

Toda segunda-feira às 8h, o Alfred envia um resumo da semana anterior sem o usuário precisar pedir.

```
Bom dia! Resumo da semana passada 📊

Total: R$ 340,00

Os maiores gastos foram:
Alimentação   R$ 140,00
Transporte    R$  90,00
Lazer         R$  80,00

Comparando com a semana anterior: +12% 📈
```

Implementação: cron job `0 8 * * 1` — busca transações dos últimos 7 dias e chama o prompt de relatório.

### 1.2 Alertas de padrão

O Alfred monitora mudanças de comportamento e avisa proativamente.

Triggers:
- Gasto numa categoria está 30%+ acima da média das últimas 4 semanas
- Mais de 3 gastos no mesmo estabelecimento em 7 dias
- Nenhum gasto registrado em 5 dias (lembrete de hábito)

```
Ei! Notei que você gastou R$ 280 com delivery essa semana.
Sua média é R$ 140. Tá tudo bem? 👀
```

### 1.3 Previsão de fechamento do mês

A partir do dia 20, o Alfred calcula a projeção do mês com base no ritmo atual.

```
Faltam 10 dias pro mês acabar.
No ritmo atual, você vai fechar em torno de R$ 2.100.

Seu mês passado fechou em R$ 1.850.
```

---

## 2. Contexto de conversa

### 2.1 Histórico curto por usuário

Manter as últimas 8 mensagens em memória (Redis ou variável em memória) para o Alfred entender referências contextuais.

```
Usuário: "Fui num restaurante hoje"
Alfred:  "Quanto foi?"
Usuário: "120"
Alfred:  ✓ Alimentação · R$ 120,00 · hoje
```

Sem contexto, a segunda mensagem "120" seria incompreensível.

### 2.2 Schema de sessão

```javascript
const session = {
  userId: "5511999999999",
  messages: [
    { role: "user", content: "Fui num restaurante hoje", ts: "..." },
    { role: "assistant", content: "Quanto foi?", ts: "..." }
  ],
  pendingExpense: {
    descricao: "Restaurante",
    categoria: "Alimentação",
    data: "2026-06-08",
    valor: null   // aguardando
  },
  expiresAt: "2026-06-08T15:00:00Z"  // sessão expira em 10 min
}
```

Armazenamento: em memória (Map) para MVP, Redis para produção.

---

## 3. Migração de armazenamento

### 3.1 Camada de abstração (desde o início)

Para facilitar a migração futura do Google Sheets para um banco de dados, toda interação com armazenamento deve passar por uma interface única:

```javascript
// src/services/storage.js
const storage = {
  async saveTransaction(userId, data) { ... },
  async getTransactions(userId, filters) { ... },
  async saveReminder(userId, data) { ... },
  async getReminders(userId) { ... },
  async getUser(userId) { ... },
  async saveUser(userId, data) { ... },
}

module.exports = storage;
// A implementação interna pode ser Sheets, SQLite ou Postgres
// sem mudar nada no resto do código
```

### 3.2 Plano de migração (pós-MVP)

| Fase | Armazenamento | Quando migrar |
|---|---|---|
| MVP | Google Sheets | 0–500 transações/usuário |
| Crescimento | SQLite | 500–5000 transações |
| Escala | PostgreSQL | 5000+ ou múltiplos usuários simultâneos |

---

## 4. Autenticação do dashboard

### 4.1 Magic link via WhatsApp

Fluxo simples sem senha:

```
1. Usuário acessa alfred.app/login
2. Informa número de telefone
3. Alfred manda via WhatsApp: "Seu link de acesso: alfred.app/auth?token=abc123"
4. Token expira em 15 minutos, uso único
5. Após clicar: sessão criada com JWT (7 dias)
```

### 4.2 Schema do token

```javascript
const token = {
  userId: "5511999999999",
  type: "magic_link",
  expiresAt: Date.now() + 15 * 60 * 1000,
  used: false
}
// Armazenado em memória ou Redis com TTL de 15min
```

---

## 5. Divisão de contas

### 5.1 Fluxo de uso

```
Usuário: "Jantar com 4 pessoas, paguei 200, divide igualmente"
Alfred:  Dividindo R$ 200,00 por 4 pessoas:
         Sua parte: R$ 50,00

         Registrei R$ 50,00 em Alimentação.
         Quer que eu avise os outros? (manda os números)
```

### 5.2 Registro

O Alfred registra apenas a parte do usuário (R$50), não o total (R$200).

Campos adicionais na transação:
```json
{
  "split": {
    "total": 200.00,
    "pessoas": 4,
    "sua_parte": 50.00
  }
}
```

---

## 6. Registro por foto

### 6.1 Fluxo

```
1. Usuário envia foto de recibo/comprovante
2. Twilio entrega a URL da imagem
3. Alfred baixa a imagem e converte para base64
4. Chama Claude API com vision: "extraia valor, estabelecimento e data desse recibo"
5. Retorna JSON com os dados
6. Confirma com o usuário antes de salvar
```

### 6.2 Prompt de visão

```
Você é um leitor de recibos e comprovantes de pagamento.

Analise a imagem e extraia as informações. Responda SOMENTE com JSON:
{
  "valor": number,
  "estabelecimento": string,
  "data": string (YYYY-MM-DD),
  "itens": [ { "descricao": string, "valor": number } ],
  "confianca": number
}

Se não conseguir ler algum campo, use null.
```

### 6.3 Implementação

```javascript
// Baixar imagem do Twilio e converter para base64
const imageBuffer = await axios.get(mediaUrl, {
  responseType: 'arraybuffer',
  auth: { username: TWILIO_SID, password: TWILIO_TOKEN }
});

const base64 = Buffer.from(imageBuffer.data).toString('base64');
const mediaType = 'image/jpeg';

// Chamar Claude API com vision
const response = await anthropic.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 500,
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: PROMPTS.receiptVision }
    ]
  }]
});
```

---

## 7. Metas mensais

### 7.1 Configuração

```
Usuário: "Quero gastar no máximo 500 com alimentação esse mês"
Alfred:  Meta definida!
         Alimentação: R$ 500,00/mês
         Vou te avisar quando chegar em 80% (R$ 400,00) ✓
```

### 7.2 Acompanhamento no dashboard

Barra de progresso por categoria:

```
Alimentação  ████████░░  R$ 380 / R$ 500  (76%)
Transporte   █████░░░░░  R$ 180 / R$ 350  (51%)
Lazer        ██████████  R$ 220 / R$ 200  ⚠️ Estourou
```

### 7.3 Alertas automáticos

| Threshold | Mensagem |
|---|---|
| 80% | "Você usou 80% do orçamento de [categoria]. Faltam R$ X." |
| 100% | "Você estourou o orçamento de [categoria] em R$ X." |
| Final do mês | Resumo de todas as metas: bateu, quase, estourou |

---

## 8. DECISIONS.md

> Este arquivo vai direto no repositório do projeto.

```markdown
# Decisões técnicas — Alfred

## 2026-06-08 — Google Sheets como armazenamento inicial

**Decisão:** usar Google Sheets em vez de banco de dados para o MVP.

**Motivo:** o usuário precisa acessar e editar seus dados diretamente,
sem depender exclusivamente do nosso dashboard. Sheets é familiar,
gratuito e não requer infraestrutura extra.

**Trade-off aceito:** queries mais lentas com volume alto de dados.
Mitigação: camada de abstração em storage.js para facilitar migração futura.

**Revisitar quando:** usuário ultrapassar 500 transações ou houver
necessidade de queries complexas.

---

## 2026-06-08 — Twilio em vez da Meta Business API diretamente

**Decisão:** usar Twilio como intermediário para a API do WhatsApp.

**Motivo:** a Meta Business API exige aprovação de conta business,
número de telefone dedicado e processo de verificação que leva dias.
O Twilio Sandbox permite testar imediatamente com número compartilhado.

**Trade-off aceito:** custo por mensagem (~$0.005) e dependência de terceiro.

**Revisitar quando:** o produto estiver validado e precisar de número
próprio — migrar para Meta Business API diretamente.

---

## 2026-06-08 — claude-haiku-4-5 para classificação, claude-sonnet-4-6 para extração

**Decisão:** usar modelos diferentes por tipo de operação.

**Motivo:** classificação é uma tarefa simples (uma palavra de resposta)
que não justifica o custo do Sonnet. Haiku é 10x mais barato e suficiente.
Extração e relatórios precisam de maior precisão — Sonnet.

**Custo estimado:** < $2/mês para 100 usuários com 10 registros cada.
```
