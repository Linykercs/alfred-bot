# Alfred — Perfil comportamental e inteligência adaptativa

**Versão:** 1.0  
**Data:** Junho 2026

---

## 1. Visão geral

O diferencial do Alfred é aprender com cada usuário ao longo do tempo. Em vez de tratar todo mundo igual, o Alfred constrói um perfil comportamental individual e usa isso pra dar insights cada vez mais relevantes, no momento certo.

Isso transforma o Alfred de um registrador passivo num conselheiro ativo — e cria um vínculo emocional com o produto que nenhum app de planilha consegue.

---

## 2. O que o Alfred aprende

### 2.1 Padrões temporais

- Dias da semana com maior gasto
- Semanas do mês com maior gasto (começo vs fim de mês)
- Horários de registro (indica quando a pessoa está mais ativa)
- Categorias que crescem em determinados períodos

### 2.2 Padrões de categoria

- Categorias onde o usuário costuma estourar o orçamento
- Categorias mais consistentes (bom hábito)
- Correlações entre categorias (ex: semanas com mais trabalho → mais delivery)
- Sazonalidade (dezembro sempre tem mais lazer)

### 2.3 Comportamento de registro

- Frequência de registro (diário, semanal, irregular)
- Tempo médio entre gasto e registro
- Categorias onde o usuário mais pede correção (indica dificuldade)
- Engajamento com insights (responde ou ignora)

---

## 3. Schema do perfil

```javascript
const perfil = {
  userId: "5511999999999",
  nome: "Felps",
  
  // Atualizado semanalmente
  padroes: {
    diasMaisGasto: ["sexta", "sabado"],        // dias da semana
    semanasMaisGasto: [1, 2],                  // 1ª e 2ª semana do mês
    categoriasCriticas: ["Alimentação", "Lazer"], // costuma estourar
    categoriasEstáveis: ["Moradia", "Saúde"],  // sempre dentro do orçamento
    mediaGastoSemanal: 340.00,
    mediaGastoMensal: 1380.00,
  },

  // Atualizado a cada novo registro
  comportamento: {
    frequenciaRegistro: "diario",    // diario | semanal | irregular
    ultimoRegistro: "2026-06-08",
    totalRegistros: 142,
    taxaCorrecao: 0.04,              // 4% dos registros são corrigidos
    engajamentoInsights: 0.72,       // 72% dos insights recebem resposta
  },

  // Calculado mensalmente
  saudeFinanceira: {
    score: 74,                        // 0-100
    tendencia: "melhorando",          // melhorando | estavel | piorando
    pontosFortes: ["Moradia", "Transporte"],
    pontosAtencao: ["Delivery", "Lazer"],
    melhorMes: "2026-03",
    sequenciaAbaixoOrcamento: 2,      // meses consecutivos abaixo do orçamento
  },

  // Atualizado após cada insight enviado
  insights: {
    ultimoEnviado: "2026-06-05",
    historico: [
      { tipo: "padrao_semanal", enviado: "2026-06-05", respondido: true },
      { tipo: "delivery_alerta", enviado: "2026-05-20", respondido: false },
    ]
  }
}
```

---

## 4. Motor de insights

### 4.1 Tipos de insight

| Tipo | Trigger | Exemplo de mensagem |
|---|---|---|
| `padrao_semanal` | Após 4 semanas de dados | "Toda sexta você gasta em média R$120 a mais." |
| `correlacao` | Correlação detectada com >70% de confiança | "Semanas com mais trabalho = mais delivery." |
| `sequencia_positiva` | 2+ meses abaixo do orçamento | "Segundo mês seguido abaixo do orçamento. 👏" |
| `categoria_critica` | Categoria estourou 3+ meses seguidos | "Delivery estourou 3 meses seguidos." |
| `anomalia` | Gasto 2x acima da média da categoria | "Esse gasto de R$300 em lazer é bem acima do normal." |
| `inatividade` | Sem registro por 5+ dias | "Não registrei nada nos últimos 5 dias." |
| `saude_score` | Calculado mensalmente | "Sua saúde financeira melhorou 8 pontos em junho." |
| `previsao_mes` | A partir do dia 20 | "No ritmo atual, você fecha o mês em R$2.100." |

### 4.2 Regras de envio

- Máximo 1 insight por dia
- Não enviar insight se o usuário não registrou nada nos últimos 3 dias
- Não repetir o mesmo tipo de insight em menos de 14 dias
- Insights positivos têm prioridade sobre alertas (não começar a semana com negativo)
- Horário de envio: entre 9h e 11h (maior taxa de leitura)

### 4.3 Algoritmo de priorização

```javascript
function selecionarInsight(perfil, insightsDisponiveis) {
  // Filtrar insights já enviados recentemente
  const candidatos = insightsDisponiveis.filter(i => {
    const ultimoEnvio = perfil.insights.historico
      .find(h => h.tipo === i.tipo)?.enviado;
    if (!ultimoEnvio) return true;
    const diasDesdeUltimo = diffDias(ultimoEnvio, hoje());
    return diasDesdeUltimo >= 14;
  });

  // Priorizar positivos no início da semana
  if (isSegundaFeira()) {
    const positivos = candidatos.filter(i => i.sentimento === 'positivo');
    if (positivos.length > 0) return positivos[0];
  }

  // Priorizar por impacto estimado
  return candidatos.sort((a, b) => b.impacto - a.impacto)[0];
}
```

---

## 5. Score de saúde financeira

### 5.1 Como é calculado

O score vai de 0 a 100 e é calculado mensalmente com base em 5 dimensões:

| Dimensão | Peso | Como mede |
|---|---|---|
| Orçamento | 30% | % de categorias dentro do limite |
| Consistência | 20% | Frequência de registro no mês |
| Tendência | 20% | Comparação com os últimos 3 meses |
| Diversificação | 15% | Nenhuma categoria representa mais de 50% do total |
| Poupança implícita | 15% | Ficou abaixo do total do mês anterior |

### 5.2 Faixas

| Score | Classificação | Mensagem |
|---|---|---|
| 85–100 | Excelente | "Sua saúde financeira está ótima." |
| 70–84 | Boa | "Você está no caminho certo." |
| 50–69 | Regular | "Tem espaço pra melhorar em algumas áreas." |
| 0–49 | Atenção | "Vamos trabalhar juntos nisso." |

### 5.3 Exemplo de mensagem mensal

```
Saúde financeira de junho: 74/100 📈

Melhorou 8 pontos em relação a maio.

Pontos fortes: Moradia, Transporte
Pontos de atenção: Delivery, Lazer

Você ficou dentro do orçamento em 3 das 5 categorias.
```

---

## 6. Implementação — quando calcular

| Evento | Ação |
|---|---|
| Novo registro salvo | Atualizar `comportamento.ultimoRegistro` e `totalRegistros` |
| Fim de semana (domingo 23h) | Calcular padrões semanais, verificar insights disponíveis |
| Primeiro dia do mês | Calcular score do mês anterior, gerar relatório |
| Dia 20 do mês | Ativar previsão de fechamento |
| 5 dias sem registro | Disparar insight de inatividade |

---

## 7. Prompt de geração de insight

```
Você é o Alfred, assistente financeiro pessoal.

Com base nos dados abaixo, gere UM insight relevante e personalizado para o usuário.
O insight deve ser:
- Baseado em um padrão real observado nos dados
- Acionável (sugere algo concreto ou faz uma pergunta)
- Curto: máximo 3 linhas
- No tom do Alfred: direto, empático, sem julgamento

Dados do usuário:
Nome: {NOME}
Padrões identificados: {PADROES}
Histórico recente: {HISTORICO}
Score atual: {SCORE}

Responda apenas com a mensagem final, sem explicação.
```

---

## 8. Modo família

### 8.1 Conceito

Uma conta Alfred, múltiplos números de WhatsApp. Cada membro registra seus gastos pelo próprio celular. O dashboard mostra tudo consolidado.

Nenhum app resolve isso de forma simples hoje.

### 8.2 Fluxo de configuração

```
Admin: "Adiciona minha namorada à conta"
Alfred: "Manda o número dela aqui."
Admin: "5511988887777"
Alfred: "Vou mandar um convite pra ela."

--- WhatsApp da namorada ---
Alfred: "Oi! O Felps te adicionou como membro da conta Alfred.
         Quer participar? Responde SIM pra confirmar."
Namorada: "SIM"
Alfred: "Pronto! Agora seus gastos aparecem no dashboard do Felps também.
         Registra um gasto pra testar."
```

### 8.3 Permissões

| Permissão | Admin | Membro |
|---|---|---|
| Registrar gasto | ✓ | ✓ |
| Consultar próprios gastos | ✓ | ✓ |
| Consultar gastos do grupo | ✓ | ✓ |
| Ver dashboard | ✓ | ✓ |
| Definir orçamentos | ✓ | ✗ |
| Adicionar membros | ✓ | ✗ |
| Receber insights | ✓ | Opcional |

### 8.4 Schema adicional

```javascript
// Novo campo na aba usuarios
{
  grupoId: "grp_abc123",   // null se usuário solo
  role: "admin",           // admin | membro
  membros: ["5511999999999", "5511988887777"]
}
```
