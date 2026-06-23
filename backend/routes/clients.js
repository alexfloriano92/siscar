/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/CLIENTS.JS
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, logActivity } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const { search } = req.query;
  let sql = 'SELECT * FROM clients WHERE tenant_id = ?';
  const params = [req.tenantId];
  if (search) {
    sql += ' AND (name LIKE ? OR cpf LIKE ? OR phone LIKE ? OR email LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  sql += ' ORDER BY created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const client = db.prepare('SELECT * FROM clients WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!client) return res.status(404).json({ error: 'Cliente não encontrado.' });
  const sales = db.prepare('SELECT * FROM sales WHERE client_id = ? AND tenant_id = ? ORDER BY created_at DESC').all(req.params.id, req.tenantId);
  res.json({ ...client, sales });
});

router.post('/', (req, res) => {
  const { name, cpf, phone, email, city, state, address, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Nome é obrigatório.' });
  const id = uuid();
  db.prepare('INSERT INTO clients (id,tenant_id,name,cpf,phone,email,city,state,address,notes) VALUES (?,?,?,?,?,?,?,?,?,?)')
    .run(id, req.tenantId, name, cpf || '', phone || '', email || '', city || '', state || '', address || '', notes || '');
  logActivity(req.tenantId, `Cliente cadastrado: ${name}`, 'client', req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM clients WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM clients WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Cliente não encontrado.' });
  const { name, cpf, phone, email, city, state, address, notes } = req.body;
  db.prepare('UPDATE clients SET name=?,cpf=?,phone=?,email=?,city=?,state=?,address=?,notes=? WHERE id=? AND tenant_id=?')
    .run(name, cpf || '', phone || '', email || '', city || '', state || '', address || '', notes || '', req.params.id, req.tenantId);
  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  const c = db.prepare('SELECT * FROM clients WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!c) return res.status(404).json({ error: 'Cliente não encontrado.' });
  db.prepare('DELETE FROM clients WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenantId);
  logActivity(req.tenantId, `Cliente removido: ${c.name}`, 'client', req.user.id);
  res.json({ message: 'Cliente removido com sucesso.' });
});

module.exports = router;
