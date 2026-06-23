/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/VISTORIAS.JS
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, logActivity, parseJSON } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM vistorias WHERE tenant_id = ?';
  const params = [req.tenantId];
  if (search) { sql += ' AND (vehicle_name LIKE ? OR plate LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }
  sql += ' ORDER BY created_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows.map(r => ({ ...r, checklist: parseJSON(r.checklist, {}), photos: parseJSON(r.photos, []) })));
});

router.post('/', (req, res) => {
  const { vehicleId, vehicleName, plate, date, checklist, photos, notes } = req.body;
  if (!plate) return res.status(400).json({ error: 'Placa é obrigatória.' });
  const id = uuid();
  db.prepare('INSERT INTO vistorias (id,tenant_id,vehicle_id,vehicle_name,plate,date,inspector_id,status,checklist,photos,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
    .run(id, req.tenantId, vehicleId || null, vehicleName || '', plate, date || new Date().toISOString().split('T')[0], req.user.id, 'concluida', JSON.stringify(checklist || {}), JSON.stringify(photos || []), notes || '');
  logActivity(req.tenantId, `Vistoria realizada: ${plate}`, 'vistoria', req.user.id);
  const row = db.prepare('SELECT * FROM vistorias WHERE id = ?').get(id);
  res.status(201).json({ ...row, checklist: parseJSON(row.checklist, {}), photos: parseJSON(row.photos, []) });
});

router.delete('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM vistorias WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Vistoria não encontrada.' });
  db.prepare('DELETE FROM vistorias WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenantId);
  res.json({ message: 'Vistoria removida.' });
});

module.exports = router;
