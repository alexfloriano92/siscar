/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/VEHICLES.JS
   CRUD de veículos — isolado por tenant_id
   ═══════════════════════════════════════════════════════════════════ */

const express = require('express');
const router = express.Router();
const { db, uuid, logActivity, parseJSON } = require('../database');
const { requireAuth } = require('../middleware/auth');

// Todas as rotas requerem autenticação
router.use(requireAuth);

/* ── GET /api/v1/vehicles ─────────────────────────────────────────── */
router.get('/', (req, res) => {
  const { status, search } = req.query;
  let sql = 'SELECT * FROM vehicles WHERE tenant_id = ?';
  const params = [req.tenantId];

  if (status && status !== 'all') { sql += ' AND status = ?'; params.push(status); }
  if (search) {
    sql += ' AND (brand LIKE ? OR model LIKE ? OR plate LIKE ? OR color LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  sql += ' ORDER BY created_at DESC';

  const vehicles = db.prepare(sql).all(...params);
  res.json(vehicles.map(v => ({ ...v, photos: parseJSON(v.photos), docs: parseJSON(v.docs) })));
});

/* ── GET /api/v1/vehicles/:id ─────────────────────────────────────── */
router.get('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND tenant_id = ?')
    .get(req.params.id, req.tenantId);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado.' });
  res.json({ ...vehicle, photos: parseJSON(vehicle.photos), docs: parseJSON(vehicle.docs) });
});

/* ── POST /api/v1/vehicles ────────────────────────────────────────── */
router.post('/', (req, res) => {
  const { brand, model, year, color, plate, km, purchasePrice, salePrice, status, category, fuel, photos, docs, notes } = req.body;
  if (!brand || !model) return res.status(400).json({ error: 'Marca e modelo são obrigatórios.' });

  const id = uuid();
  db.prepare(`INSERT INTO vehicles (id,tenant_id,brand,model,year,color,plate,km,purchase_price,sale_price,status,category,fuel,photos,docs,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(id, req.tenantId, brand, model, year || null, color || '', plate || '', km || 0, purchasePrice || 0, salePrice || 0, status || 'disponivel', category || '', fuel || '', JSON.stringify(photos || []), JSON.stringify(docs || []), notes || '');

  logActivity(req.tenantId, `Veículo cadastrado: ${brand} ${model}`, 'vehicle', req.user.id);
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(id);
  res.status(201).json({ ...vehicle, photos: parseJSON(vehicle.photos), docs: parseJSON(vehicle.docs) });
});

/* ── PUT /api/v1/vehicles/:id ─────────────────────────────────────── */
router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM vehicles WHERE id = ? AND tenant_id = ?')
    .get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Veículo não encontrado.' });

  const { brand, model, year, color, plate, km, purchasePrice, salePrice, status, category, fuel, photos, docs, notes } = req.body;
  db.prepare(`UPDATE vehicles SET brand=?,model=?,year=?,color=?,plate=?,km=?,purchase_price=?,sale_price=?,status=?,category=?,fuel=?,photos=?,docs=?,notes=? WHERE id=? AND tenant_id=?`)
    .run(brand, model, year, color, plate, km, purchasePrice, salePrice, status, category, fuel, JSON.stringify(photos || []), JSON.stringify(docs || []), notes || '', req.params.id, req.tenantId);

  logActivity(req.tenantId, `Veículo atualizado: ${brand} ${model}`, 'vehicle', req.user.id);
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ?').get(req.params.id);
  res.json({ ...vehicle, photos: parseJSON(vehicle.photos), docs: parseJSON(vehicle.docs) });
});

/* ── DELETE /api/v1/vehicles/:id ──────────────────────────────────── */
router.delete('/:id', (req, res) => {
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND tenant_id = ?')
    .get(req.params.id, req.tenantId);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado.' });

  db.prepare('DELETE FROM vehicles WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenantId);
  logActivity(req.tenantId, `Veículo removido: ${vehicle.brand} ${vehicle.model}`, 'vehicle', req.user.id);
  res.json({ message: 'Veículo removido com sucesso.' });
});

module.exports = router;
