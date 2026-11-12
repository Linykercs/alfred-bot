const express = require('express');
const router  = express.Router();
const storage = require('../services/storage');
const auth    = require('../services/auth');

// ── Auth middleware ────────────────────────────────────────────────────────────

function requireAuth(req, res, next) {
  const header = req.headers['authorization'] || '';
  const token  = header.replace('Bearer ', '').trim();
  const session = auth.getSession(token);
  if (!session) return res.status(401).json({ error: 'Não autenticado' });
  req.userId = session.userId;
  next();
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toISODate(brDate) {
  const [d, m, y] = brDate.split('/');
  return `${y}-${m}-${d}`;
}

function getMonthRange(month) {
  const [y, mo] = month.split('-').map(Number);
  const days = new Date(y, mo, 0).getDate();
  const pad  = String(mo).padStart(2, '0');
  return { startDate: `${y}-${pad}-01`, endDate: `${y}-${pad}-${days}` };
}

function aggregate(transactions) {
  const total = transactions.reduce((s, t) => s + t.valor, 0);
  const map   = {};
  for (const t of transactions) {
    map[t.categoria] = (map[t.categoria] || 0) + t.valor;
  }
  const categories = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, catTotal]) => ({
      name,
      total:   parseFloat(catTotal.toFixed(2)),
      percent: total > 0 ? Math.round((catTotal / total) * 100) : 0,
    }));
  return { total: parseFloat(total.toFixed(2)), categories, count: transactions.length };
}

// ── Auth endpoints (public) ───────────────────────────────────────────────────

// POST /api/auth/request-otp  { phone }
router.post('/auth/request-otp', async (req, res) => {
  const { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'phone obrigatório' });
  try {
    const userId = await auth.requestOTP(phone);
    res.json({ ok: true, userId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// POST /api/auth/verify-otp  { phone, code }
router.post('/auth/verify-otp', async (req, res) => {
  const { phone, code } = req.body;
  if (!phone || !code) return res.status(400).json({ error: 'phone e code obrigatórios' });
  const result = auth.verifyOTP(phone, code);
  if (!result) return res.status(401).json({ error: 'Código inválido ou expirado' });

  // Auto-cria usuário se não existir
  let user = await storage.getUser(result.userId);
  if (!user) {
    user = await storage.saveUser(result.userId, { nome: '' });
  }
  res.json({ token: result.token, userId: result.userId, name: user.nome || '' });
});

// POST /api/auth/logout
router.post('/auth/logout', (req, res) => {
  const token = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
  auth.deleteSession(token);
  res.json({ ok: true });
});

// ── Protected endpoints ───────────────────────────────────────────────────────

// POST /api/me/name  { name }
router.post('/me/name', requireAuth, async (req, res) => {
  const { name } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name obrigatório' });
  let user = await storage.getUser(req.userId);
  if (user) {
    await storage.updateUserName(req.userId, name.trim());
  } else {
    await storage.saveUser(req.userId, { nome: name.trim() });
  }
  res.json({ ok: true, name: name.trim() });
});

// GET /api/me
router.get('/me', requireAuth, async (req, res) => {
  const user = await storage.getUser(req.userId);
  res.json({ userId: req.userId, name: user?.nome || '' });
});

// GET /api/summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const { startDate, endDate } = getMonthRange(month);
    const txs = await storage.getTransactions(req.userId, { startDate, endDate });
    res.json({ month, ...aggregate(txs) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/transactions
router.get('/transactions', requireAuth, async (req, res) => {
  try {
    const month = req.query.month || new Date().toISOString().slice(0, 7);
    const { startDate, endDate } = getMonthRange(month);
    const txs = await storage.getTransactions(req.userId, { startDate, endDate });
    txs.sort((a, b) => toISODate(b.data).localeCompare(toISODate(a.data)));
    res.json(txs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/trends
router.get('/trends', requireAuth, async (req, res) => {
  try {
    const months  = parseInt(req.query.months || '6', 10);
    const results = [];
    const now     = new Date();
    for (let i = months - 1; i >= 0; i--) {
      const d  = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mo = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const { startDate, endDate } = getMonthRange(mo);
      const txs   = await storage.getTransactions(req.userId, { startDate, endDate });
      const total = txs.reduce((s, t) => s + t.valor, 0);
      results.push({ month: mo, total: parseFloat(total.toFixed(2)) });
    }
    res.json(results);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/categories
router.get('/categories', requireAuth, async (req, res) => {
  try {
    const user = await storage.getUser(req.userId);
    res.json(user?.categorias || storage.DEFAULT_CATEGORIES);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/health', (_req, res) => res.json({ status: 'ok' }));

module.exports = router;
