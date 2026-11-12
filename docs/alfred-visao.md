# Alfred — Documento de visão

**Versão:** 1.0  
**Data:** Junho 2026  
**Status:** Em elaboração

---

## 1. Visão geral

Alfred é um assistente financeiro pessoal que vive no WhatsApp. O usuário conversa com ele em linguagem natural — como mandaria uma mensagem pra um amigo — e o Alfred registra gastos, organiza por categorias, gera relatórios e envia lembretes, tudo sem sair do app de mensagens que já usa todos os dias.

---

## 2. O problema

A maioria das pessoas sabe que precisa controlar as finanças, mas não faz porque:

- Abrir um app separado tem fricção demais
- Planilhas exigem disciplina que poucos mantêm
- Ferramentas financeiras costumam ser complexas e intimidadoras
- O registro do gasto acontece horas depois de ter acontecido — e às vezes é esquecido

O resultado: a pessoa não sabe quanto gastou no mês, não enxerga padrões e não consegue mudar comportamentos.

---

## 3. A solução

Alfred elimina a fricção. O registro de um gasto é tão simples quanto mandar uma mensagem:

> "Gastei 40 reais no almoço"  
> "Paguei 120 no mercado"  
> "Uber 18 reais"

O bot entende, categoriza automaticamente, salva na planilha e confirma. Quando o usuário quiser saber como está, é só perguntar:

> "Quanto gastei essa semana?"  
> "Resumo de maio"  
> "Quanto foi em comida esse mês?"

---

## 4. Público-alvo

**Perfil primário:** Jovens adultos (18–35 anos) que usam WhatsApp diariamente, têm renda própria e querem mais controle financeiro mas nunca conseguiram manter o hábito com apps tradicionais.

**Perfil secundário:** Qualquer pessoa que já tentou usar planilha ou app financeiro e abandonou por falta de praticidade.

---

## 5. Proposta de valor

| Para quem... | O Alfred oferece... | Diferente de... |
|---|---|---|
| Quer controlar gastos | Registro em segundos pelo WhatsApp | Apps que exigem login e navegação |
| Esquece de registrar | Confirmação imediata e lembretes | Planilhas que ficam paradas |
| Quer entender seus padrões | Relatórios por categoria e período | Extratos bancários sem contexto |
| Não quer aprender uma ferramenta | Linguagem natural, zero comandos | Aplicativos com curva de aprendizado |

---

## 6. Funcionalidades principais (MVP)

### 6.1 Registro de gastos
- O usuário descreve o gasto em linguagem livre
- O Alfred extrai: valor, categoria, data e descrição
- Confirma o registro com resumo
- Salva na planilha Google Sheets do usuário

### 6.2 Consultas
- "Quanto gastei hoje / essa semana / esse mês?"
- "Quanto gastei com [categoria]?"
- "Qual foi meu maior gasto essa semana?"
- "Resumo do mês de [mês]"

### 6.3 Relatórios
- Resumo mensal por categoria
- Comparativo entre meses
- Alertas quando categoria ultrapassa limite definido

### 6.4 Lembretes
- "Me lembra sexta às 9h que tenho reunião"
- "Me lembra todo dia 10 de pagar o cartão"
- Entrega via WhatsApp no horário certo

### 6.5 Dashboard web *(pós-MVP)*
- Visão geral dos gastos com gráficos
- Filtros por período e categoria
- Exportação de relatório

---

## 7. Categorias padrão

| Categoria | Exemplos |
|---|---|
| Alimentação | Restaurante, lanche, delivery, mercado |
| Transporte | Uber, ônibus, gasolina, pedágio |
| Moradia | Aluguel, condomínio, luz, água, internet |
| Saúde | Farmácia, consulta, academia |
| Lazer | Cinema, bar, viagem, streaming |
| Educação | Curso, livro, assinatura |
| Compras | Roupa, eletrônico, presente |
| Outros | Tudo que não se encaixa acima |

O usuário pode criar categorias personalizadas após o onboarding.

---

## 8. Fora do escopo (MVP)

- Integração com banco ou cartão de crédito
- Múltiplos usuários / contas compartilhadas
- App mobile nativo
- Metas e planejamento orçamentário
- Importação de extratos

---

## 9. Métricas de sucesso

| Métrica | Meta (3 meses) |
|---|---|
| Usuários ativos | 100 |
| Gastos registrados por usuário/mês | ≥ 10 |
| Taxa de retenção (semana 2) | ≥ 60% |
| Tempo médio de registro | < 15 segundos |
| NPS | ≥ 7 |

---

## 10. Stack tecnológica (visão geral)

| Camada | Tecnologia |
|---|---|
| Interface | WhatsApp (via Twilio ou Meta Business API) |
| Backend | Node.js + Express |
| Inteligência | Claude API (Anthropic) |
| Armazenamento | Google Sheets API |
| Agendamento | node-cron |
| Hospedagem | Railway ou Render |
| Dashboard | React + Recharts |

---

## 11. Próximos passos

1. **User stories e casos de uso** — detalhar cada interação com o bot
2. **Arquitetura técnica** — estrutura de pastas, contratos de API, schema da planilha
3. **Prompt engineering** — sistema de instruções do Alfred para a Claude API
4. **Design visual** — identidade, wireframes e protótipo do dashboard
5. **Implementação** — começar pelo webhook + NLP + Google Sheets
