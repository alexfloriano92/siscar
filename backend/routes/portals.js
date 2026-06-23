/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/PORTALS.JS
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, logActivity } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  res.json(db.prepare('SELECT * FROM portals WHERE tenant_id = ? ORDER BY name').all(req.tenantId));
});

router.put('/:id/toggle', (req, res) => {
  const p = db.prepare('SELECT * FROM portals WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!p) return res.status(404).json({ error: 'Portal não encontrado.' });
  db.prepare('UPDATE portals SET active = ? WHERE id = ? AND tenant_id = ?').run(p.active ? 0 : 1, req.params.id, req.tenantId);
  logActivity(req.tenantId, `Portal ${p.name} ${p.active ? 'desativado' : 'ativado'}`, 'portal', req.user.id);
  res.json(db.prepare('SELECT * FROM portals WHERE id = ?').get(req.params.id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM portals WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Portal não encontrado.' });
  const { listings, views } = req.body;
  db.prepare('UPDATE portals SET listings=?, views=? WHERE id=? AND tenant_id=?').run(listings || 0, views || 0, req.params.id, req.tenantId);
  res.json(db.prepare('SELECT * FROM portals WHERE id = ?').get(req.params.id));
});

module.exports = router;
