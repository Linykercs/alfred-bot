const { report } = require('../services/claude');
const { sendMessage } = require('../services/twilio');
const storage = require('../services/storage');
const { today, formatDate, fromDisplayDate } = require('../utils/date');
const { currency } = require('../utils/format');

const MONTH_NAMES = {
  janeiro:1, fevereiro:2, março:3, abril:4, maio:5, junho:6,
  julho:7, agosto:8, setembro:9, outubro:10, novembro:11, dezembro:12,
};

const CATEGORY_PATTERNS = [
  [/comida|alimenta[çc][aã]o|restaurante|lanche|delivery|mercado|café|cafe|padaria/, 'Alimentação'],
  [/transporte|uber|taxi|[oô]nibus|metr[oô]|gasolina|pedágio|pedagio|estacionamento/,  'Transporte'],
  [/moradia|aluguel|condom[ií]nio|luz|[aá]gua|gás|\bgas\b|internet|iptu/,               'Moradia'],
  [/sa[úu]de|farm[aá]cia|consulta|m[eé]dico|dentista|academia|plano/,                  'Saúde'],
  [/lazer|cinema|bar|show|viagem|streaming|jogo|hobby/,                                  'Lazer'],
  [/educa[çc][aã]o|curso|livro|escola|faculdade/,                                       'Educação'],
  [/compras|roupa|eletr[oô]nico|presente/,                                               'Compras'],
];

function detectCategory(msg) {
  for (const [regex, cat] of CATEGORY_PATTERNS) {
    if (regex.test(msg)) return cat;
  }
  return null;
}

function parsePeriod(message) {
  const msg = message.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, ''); // remove acentos para regex simples
  const t   = today();
  const now = new Date(t);
  const y   = now.getFullYear();
  const mo  = now.getMonth() + 1; // 1-based

  if (/hoje/.test(msg)) {
    return { startDate: t, endDate: t, label: 'hoje' };
  }

  if (/essa semana|esta semana/.test(msg)) {
    const dow  = now.getDay(); // 0=Dom
    const diff = dow === 0 ? 6 : dow - 1; // dias desde segunda
    const mon  = new Date(now);
    mon.setDate(now.getDate() - diff);
    return { startDate: mon.toISOString().slice(0, 10), endDate: t, label: 'essa semana' };
  }

  if (/semana passada/.test(msg)) {
    const dow     = now.getDay();
    const diff    = dow === 0 ? 6 : dow - 1;
    const lastMon = new Date(now);
    lastMon.setDate(now.getDate() - diff - 7);
    const lastSun = new Date(lastMon);
    lastSun.setDate(lastMon.getDate() + 6);
    return {
      startDate: lastMon.toISOString().slice(0, 10),
      endDate:   lastSun.toISOString().slice(0, 10),
      label:     'semana passada',
    };
  }

  if (/mes passado|mês passado/.test(msg)) {
    const lastMo = mo === 1 ? 12 : mo - 1;
    const lastY  = mo === 1 ? y - 1 : y;
    const last   = String(lastMo).padStart(2, '0');
    const days   = new Date(lastY, lastMo, 0).getDate();
    return {
      startDate: `${lastY}-${last}-01`,
      endDate:   `${lastY}-${last}-${days}`,
      label:     'mês passado',
    };
  }

  // "resumo de maio", "quanto em junho", etc.
  for (const [name, num] of Object.entries(MONTH_NAMES)) {
    const normalized = name.normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (msg.includes(normalized)) {
      const refY = num > mo ? y - 1 : y;
      const pad  = String(num).padStart(2, '0');
      const days = new Date(refY, num, 0).getDate();
      return {
        startDate: `${refY}-${pad}-01`,
        endDate:   `${refY}-${pad}-${days}`,
        label:     name.charAt(0).toUpperCase() + name.slice(1),
      };
    }
  }

  // padrão: mês atual
  const pad = String(mo).padStart(2, '0');
  return {
    startDate: `${y}-${pad}-01`,
    endDate:   t,
    label:     'esse mês',
  };
}

function aggregate(transactions) {
  const total = transactions.reduce((s, t) => s + t.valor, 0);
  const map   = {};
  for (const t of transactions) {
    map[t.categoria] = (map[t.categoria] || 0) + t.valor;
  }
  const categorias = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([nome, catTotal]) => ({
      nome,
      total:      catTotal,
      percentual: Math.round((catTotal / total) * 100),
    }));
  return { total, categorias };
}

async function handle(userId, message) {
  const { startDate, endDate, label } = parsePeriod(message);
  const categoria = detectCategory(message.toLowerCase());

  const transactions = await storage.getTransactions(userId, { startDate, endDate, categoria });

  if (!transactions.length) {
    const scope = categoria ? `em ${categoria}` : '';
    await sendMessage(userId, `Não encontrei gastos ${scope} ${label}.`.trim());
    return;
  }

  // Maior gasto
  if (/maior|maior gasto/.test(message.toLowerCase())) {
    const t = transactions.reduce((max, cur) => cur.valor > max.valor ? cur : max);
    await sendMessage(
      userId,
      `Maior gasto ${label}:\n${t.descricao} · ${currency(t.valor)}\n${t.categoria} · ${formatDate(fromDisplayDate(t.data))}`
    );
    return;
  }

  // Consulta de categoria específica: responde direto sem chamar Claude
  if (categoria) {
    const total = transactions.reduce((s, t) => s + t.valor, 0);
    await sendMessage(userId, `${categoria} ${label}:\n${currency(total)}\n(${transactions.length} registro${transactions.length > 1 ? 's' : ''})`);
    return;
  }

  // Relatório completo via Claude
  const { total, categorias } = aggregate(transactions);
  const text = await report({ periodo: label, total, categorias });
  await sendMessage(userId, text);
}

module.exports = handle;
