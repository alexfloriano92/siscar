/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/CONFIG.JS + ROUTES/PORTALS.JS + EVALUATIONS + VISTORIAS
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, logActivity, parseJSON } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

/* ── Store Config ─────────────────────────────────────────────────── */
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT key, value FROM store_config WHERE tenant_id = ?').all(req.tenantId);
  const config = {};
  rows.forEach(r => config[r.key] = r.value);
  res.json(config);
});

router.put('/', (req, res) => {
  const stmt = db.prepare('INSERT OR REPLACE INTO store_config (tenant_id, key, value) VALUES (?,?,?)');
  const update = db.transaction((obj) => {
    for (const [key, value] of Object.entries(obj)) {
      stmt.run(req.tenantId, key, String(value));
    }
  });
  update(req.body);
  logActivity(req.tenantId, 'Configurações da loja atualizadas', 'config', req.user.id);
  res.json({ message: 'Configurações salvas com sucesso.' });
});

module.exports = router;
