/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/FINANCIALS.JS
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, logActivity } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const { type, category, dateFrom, dateTo, search } = req.query;
  let sql = 'SELECT * FROM financials WHERE tenant_id = ?';
  const params = [req.tenantId];
  if (type) { sql += ' AND type = ?'; params.push(type); }
  if (category) { sql += ' AND category = ?'; params.push(category); }
  if (dateFrom) { sql += ' AND date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND date <= ?'; params.push(dateTo); }
  if (search) { sql += ' AND description LIKE ?'; params.push(`%${search}%`); }
  sql += ' ORDER BY date DESC, created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/summary', (req, res) => {
  const { dateFrom, dateTo } = req.query;
  let sql = 'SELECT type, SUM(amount) as total FROM financials WHERE tenant_id = ?';
  const params = [req.tenantId];
  if (dateFrom) { sql += ' AND date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND date <= ?'; params.push(dateTo); }
  sql += ' GROUP BY type';
  const rows = db.prepare(sql).all(...params);
  const receitas = rows.find(r => r.type === 'receita')?.total || 0;
  const despesas = rows.find(r => r.type === 'despesa')?.total || 0;
  res.json({ receitas, despesas, saldo: receitas - despesas });
});

router.post('/', (req, res) => {
  const { type, category, description, amount, date, status } = req.body;
  if (!type || !amount) return res.status(400).json({ error: 'Tipo e valor são obrigatórios.' });
  const id = uuid();
  db.prepare('INSERT INTO financials (id,tenant_id,type,category,description,amount,date,status) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, req.tenantId, type, category || '', description || '', amount, date || new Date().toISOString().split('T')[0], status || 'pendente');
  logActivity(req.tenantId, `Lançamento ${type}: ${description || category}`, 'financial', req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM financials WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM financials WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Lançamento não encontrado.' });
  const { type, category, description, amount, date, status } = req.body;
  db.prepare('UPDATE financials SET type=?,category=?,description=?,amount=?,date=?,status=? WHERE id=? AND tenant_id=?')
    .run(type, category, description, amount, date, status, req.params.id, req.tenantId);
  res.json(db.prepare('SELECT * FROM financials WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM financials WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Lançamento não encontrado.' });
  db.prepare('DELETE FROM financials WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenantId);
  res.json({ message: 'Lançamento removido.' });
});

module.exports = router;
