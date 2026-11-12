# Decisões técnicas — Alfred

Registro das principais decisões do projeto, com contexto e motivo.
Atualizar sempre que uma decisão relevante for tomada.

---

## 2026-06-08 — Google Sheets como armazenamento inicial

**Decisão:** usar Google Sheets em vez de banco de dados para o MVP.

**Motivo:** o usuário precisa acessar e editar seus dados diretamente, sem depender exclusivamente do nosso dashboard. Sheets é familiar, gratuito e não requer infraestrutura extra.

**Trade-off aceito:** queries mais lentas com volume alto de dados.

**Mitigação:** camada de abstração em `storage.js` — toda interação com dados passa por uma interface única, facilitando migração futura sem tocar no restante do código.

**Revisitar quando:** usuário ultrapassar 500 transações ou houver necessidade de queries complexas.

---

## 2026-06-08 — Twilio em vez da Meta Business API diretamente

**Decisão:** usar Twilio como intermediário para a API do WhatsApp.

**Motivo:** a Meta Business API exige aprovação de conta business, número de telefone dedicado e processo de verificação que leva dias. O Twilio Sandbox permite testar imediatamente com número compartilhado.

**Trade-off aceito:** custo por mensagem (~$0.005) e dependência de terceiro.

**Revisitar quando:** o produto estiver validado e precisar de número próprio — migrar para Meta Business API diretamente reduz custo e dependência.

---

## 2026-06-08 — claude-haiku-4-5 para classificação, claude-sonnet-4-6 para extração

**Decisão:** usar modelos diferentes por tipo de operação.

**Motivo:** classificação é uma tarefa simples (retorna uma palavra) que não justifica o custo do Sonnet. Haiku é ~10x mais barato e suficiente para isso. Extração de dados financeiros e geração de relatórios exigem maior precisão — Sonnet.

**Custo estimado:** < $2/mês para 100 usuários com 10 registros cada.

---

## 2026-06-08 — Sessões de conversa em memória (não persistidas)

**Decisão:** armazenar sessões de conversa (contexto curto) em memória RAM, não no Google Sheets.

**Motivo:** sessões expiram em 10 minutos e não precisam sobreviver a restarts. Persistir no Sheets adicionaria latência e complexidade desnecessárias no MVP.

**Trade-off aceito:** sessões perdidas em caso de restart do servidor.

**Revisitar quando:** precisar de sessões mais longas ou persistentes — migrar para Redis.

---

## 2026-06-08 — Magic link via WhatsApp para autenticação do dashboard

**Decisão:** autenticação por magic link enviado via WhatsApp, sem senha.

**Motivo:** o usuário já está verificado pelo próprio WhatsApp (tem o número). Criar um sistema de senha seria redundante e adicionaria fricção. Magic link é seguro, simples e consistente com a experiência do produto.

**Trade-off aceito:** depende do WhatsApp para fazer login — se o usuário mudar de número, perde o acesso.

---

## 2026-06-08 — Monorepo: backend + dashboard na mesma pasta

**Decisão:** manter backend (Node.js) e dashboard (React) no mesmo repositório, em pastas separadas.

**Motivo:** facilita o desenvolvimento paralelo, compartilhamento de tipos/constantes e deploy conjunto no início do projeto.

**Revisitar quando:** os times de backend e frontend crescerem e precisarem de ciclos de deploy independentes.
