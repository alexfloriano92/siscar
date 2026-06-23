/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/EVALUATIONS.JS + VISTORIAS.JS + ACTIVITIES.JS
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, logActivity, parseJSON } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/* ── Evaluations ──────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT e.*, c.name as client_name FROM evaluations e LEFT JOIN clients c ON e.client_id = c.id WHERE e.tenant_id = ?';
  const params = [req.tenantId];
  if (status) { sql += ' AND e.status = ?'; params.push(status); }
  if (search) { sql += ' AND (e.vehicle LIKE ? OR e.plate LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY e.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.post('/', (req, res) => {
  const { vehicle, plate, clientId, date, fipePrice, offeredPrice, status, notes } = req.body;
  if (!vehicle) return res.status(400).json({ error: 'Veículo é obrigatório.' });
  const id = uuid();
  db.prepare('INSERT INTO evaluations (id,tenant_id,vehicle,plate,client_id,evaluator_id,date,fipe_price,offered_price,status,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, req.tenantId, vehicle, plate || '', clientId || null, req.user.id, date || new Date().toISOString().split('T')[0], fipePrice || 0, offeredPrice || 0, status || 'pendente', notes || '');
  logActivity(req.tenantId, `Avaliação criada: ${vehicle}`, 'evaluation', req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM evaluations WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Avaliação não encontrada.' });
  const { vehicle, plate, clientId, date, fipePrice, offeredPrice, status, notes } = req.body;
  db.prepare('UPDATE evaluations SET vehicle=?,plate=?,client_id=?,date=?,fipe_price=?,offered_price=?,status=?,notes=? WHERE id=? AND tenant_id=?')
    .run(vehicle, plate || '', clientId || null, date, fipePrice || 0, offeredPrice || 0, status, notes || '', req.params.id, req.tenantId);
  res.json(db.prepare('SELECT * FROM evaluations WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM evaluations WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Avaliação não encontrada.' });
  db.prepare('DELETE FROM evaluations WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenantId);
  res.json({ message: 'Avaliação removida.' });
});

module.exports = router;
