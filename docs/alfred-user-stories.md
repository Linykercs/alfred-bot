# Alfred — User stories e casos de uso

**Versão:** 1.0  
**Data:** Junho 2026

---

## 1. Épicos

| ID | Épico |
|---|---|
| E1 | Registro de gastos |
| E2 | Consultas e relatórios |
| E3 | Lembretes |
| E4 | Onboarding e configuração |
| E5 | Dashboard web |

---

## 2. User stories

### E1 — Registro de gastos

**US01**  
Como usuário, quero enviar uma mensagem descrevendo um gasto em linguagem livre, para que o Alfred registre sem eu precisar preencher formulário.

> Critérios de aceite:
> - Alfred extrai valor, categoria e data da mensagem
> - Confirma o registro com resumo ("Anotei: Alimentação · R$40 · hoje")
> - Salva na planilha em menos de 3 segundos
> - Se não conseguir identificar o valor, pede confirmação

**US02**  
Como usuário, quero que o Alfred sugira a categoria automaticamente, para que eu não precise escolher toda vez.

> Critérios de aceite:
> - Alfred categoriza com base nas palavras-chave da mensagem
> - Acerto esperado ≥ 85% nos casos comuns
> - Se incerto, sugere e pergunta ("Isso é Transporte, certo?")

**US03**  
Como usuário, quero corrigir um registro errado, para que minha planilha fique precisa.

> Critérios de aceite:
> - Usuário pode dizer "corrige o último" ou "aquele gasto foi 50, não 40"
> - Alfred confirma a correção antes de salvar
> - Registro anterior é substituído, não duplicado

**US04**  
Como usuário, quero registrar um gasto com data retroativa, para que eu possa lançar gastos que esqueci no dia.

> Critérios de aceite:
> - Alfred interpreta "ontem", "sexta", "dia 3" corretamente
> - Confirma a data antes de salvar

---

### E2 — Consultas e relatórios

**US05**  
Como usuário, quero perguntar quanto gastei em um período, para que eu saiba minha situação financeira rapidamente.

> Critérios de aceite:
> - Responde a "hoje", "essa semana", "esse mês", "mês passado"
> - Mostra total geral e breakdown por categoria
> - Resposta em menos de 5 segundos

**US06**  
Como usuário, quero consultar gastos por categoria, para que eu entenda onde estou gastando mais.

> Critérios de aceite:
> - "Quanto gastei com comida esse mês?" retorna total da categoria
> - Lista os registros individuais se solicitado

**US07**  
Como usuário, quero receber um resumo mensal automático, para que eu tenha visão geral sem precisar pedir.

> Critérios de aceite:
> - Enviado no primeiro dia do mês seguinte
> - Inclui: total do mês, top 3 categorias, comparativo com mês anterior

**US08**  
Como usuário, quero saber qual foi meu maior gasto do mês, para identificar gastos fora do padrão.

> Critérios de aceite:
> - Alfred retorna o item, valor, categoria e data

---

### E3 — Lembretes

**US09**  
Como usuário, quero criar um lembrete por mensagem, para que o Alfred me notifique no horário certo.

> Critérios de aceite:
> - Interpreta datas relativas ("sexta", "amanhã", "daqui 2 horas")
> - Interpreta horários em linguagem natural ("às 9h", "de manhã")
> - Confirma: "Ok, te lembro sexta às 9h: reunião"
> - Entrega a mensagem no WhatsApp no horário exato

**US10**  
Como usuário, quero criar lembretes recorrentes, para que eu não esqueça compromissos fixos.

> Critérios de aceite:
> - Suporta "todo dia X", "toda semana na [dia]", "todo mês"
> - Usuário pode cancelar com "cancela o lembrete do cartão"

**US11**  
Como usuário, quero listar meus lembretes ativos, para saber o que está agendado.

> Critérios de aceite:
> - "Quais são meus lembretes?" lista todos com data/hora
> - Opção de cancelar direto na resposta

---

### E4 — Onboarding e configuração

**US12**  
Como novo usuário, quero um onboarding guiado, para que eu entenda como usar o Alfred sem ler documentação.

> Critérios de aceite:
> - Boas-vindas com nome e explicação em até 3 mensagens
> - Exemplo prático interativo ("tente registrar um gasto agora")
> - Vinculação com Google Sheets explicada de forma simples

**US13**  
Como usuário, quero personalizar minhas categorias, para que o Alfred use os nomes que fazem sentido pra mim.

> Critérios de aceite:
> - "Cria a categoria Academia" funciona
> - Categoria aparece nas consultas e relatórios

**US14**  
Como usuário, quero definir limites por categoria, para receber alertas quando estiver gastando demais.

> Critérios de aceite:
> - "Me avisa quando comida passar de 600 reais no mês"
> - Alfred envia alerta quando 80% do limite é atingido
> - Avisa novamente quando limite é ultrapassado

---

### E5 — Dashboard web

**US15**  
Como usuário, quero acessar um dashboard web, para visualizar meus gastos em gráficos.

> Critérios de aceite:
> - Login via link enviado pelo Alfred
> - Cards de resumo: total do mês, maior categoria, comparativo
> - Gráfico de pizza por categoria
> - Gráfico de linha por período
> - Lista de transações com filtro

---

## 3. Fluxos principais

### Fluxo 1 — Registro de gasto

```
Usuário: "Gastei 40 no almoço"
Alfred:  Entendendo...
Alfred:  ✓ Anotado!
         Alimentação · R$ 40,00 · hoje
         Total de hoje: R$ 40,00
```

### Fluxo 2 — Consulta mensal

```
Usuário: "Quanto gastei esse mês?"
Alfred:  Junho 2026 · até hoje

         Total: R$ 1.240,00

         Alimentação    R$ 480,00  ████████ 39%
         Transporte     R$ 310,00  █████    25%
         Moradia        R$ 250,00  ████     20%
         Lazer          R$ 120,00  ██        10%
         Outros         R$  80,00  █          6%
```

### Fluxo 3 — Lembrete

```
Usuário: "Me lembra amanhã às 8h de pagar o boleto"
Alfred:  Combinado! Vou te avisar amanhã às 8h:
         "pagar o boleto" ✓

--- no dia seguinte às 8h ---

Alfred:  Bom dia! Lembrete:
         pagar o boleto
```

### Fluxo 4 — Categoria não reconhecida

```
Usuário: "Gastei 200 no dentista"
Alfred:  Registrei como Saúde · R$ 200,00 · hoje
         Está certo?
Usuário: "Sim"
Alfred:  ✓ Salvo!
```

---

## 4. Mensagens de erro e edge cases

| Situação | Comportamento do Alfred |
|---|---|
| Mensagem sem valor | "Quanto foi o gasto?" |
| Valor ambíguo ("uns 50") | Registra 50 e confirma |
| Data no futuro | "Você quis dizer hoje ou é um gasto futuro?" |
| Google Sheets offline | "Tô com problema pra salvar agora, tenta em instantes" |
| Mensagem fora de contexto | Responde normalmente como assistente |
| Gasto duplicado (mesmo valor + categoria + dia) | Alerta: "Já registrei algo parecido hoje, confirma?" |
