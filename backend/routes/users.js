/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/USERS.JS
   Gestão de usuários dentro de um tenant
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, hashPassword, logActivity, parseJSON } = require('../database');
const { requireAuth, requirePermission } = require('../middleware/auth');

router.use(requireAuth);
router.use(requirePermission('usuarios'));

router.get('/', (req, res) => {
  const users = db.prepare('SELECT id,name,email,role,phone,active,last_login,permissions,created_at FROM users WHERE tenant_id = ? ORDER BY created_at DESC')
    .all(req.tenantId);
  res.json(users.map(u => ({ ...u, permissions: parseJSON(u.permissions, {}) })));
});

router.get('/:id', (req, res) => {
  const user = db.prepare('SELECT id,name,email,role,phone,active,last_login,permissions,created_at FROM users WHERE id = ? AND tenant_id = ?')
    .get(req.params.id, req.tenantId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  res.json({ ...user, permissions: parseJSON(user.permissions, {}) });
});

router.post('/', (req, res) => {
  const { name, email, password, role, phone, permissions } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ? AND tenant_id = ?').get(email.toLowerCase(), req.tenantId);
  if (existing) return res.status(409).json({ error: 'Este e-mail já está em uso nesta loja.' });

  const id = uuid();
  db.prepare('INSERT INTO users (id,tenant_id,name,email,password_hash,role,phone,permissions) VALUES (?,?,?,?,?,?,?,?)')
    .run(id, req.tenantId, name, email.toLowerCase(), hashPassword(password), role || 'vendedor', phone || '', JSON.stringify(permissions || {}));

  logActivity(req.tenantId, `Usuário criado: ${name}`, 'user', req.user.id);
  const user = db.prepare('SELECT id,name,email,role,phone,active,permissions FROM users WHERE id = ?').get(id);
  res.status(201).json({ ...user, permissions: parseJSON(user.permissions, {}) });
});

router.put('/:id', (req, res) => {
  const existing = db.prepare('SELECT id FROM users WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!existing) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const { name, email, password, role, phone, permissions, active } = req.body;
  let sql = 'UPDATE users SET name=?,email=?,role=?,phone=?,permissions=?,active=?';
  const params = [name, email?.toLowerCase(), role, phone || '', JSON.stringify(permissions || {}), active !== undefined ? (active ? 1 : 0) : 1];

  if (password) { sql += ',password_hash=?'; params.push(hashPassword(password)); }
  sql += ' WHERE id=? AND tenant_id=?';
  params.push(req.params.id, req.tenantId);
  db.prepare(sql).run(...params);

  const user = db.prepare('SELECT id,name,email,role,phone,active,permissions FROM users WHERE id = ?').get(req.params.id);
  res.json({ ...user, permissions: parseJSON(user.permissions, {}) });
});

router.put('/:id/toggle', (req, res) => {
  const user = db.prepare('SELECT id,active FROM users WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  // Não pode desativar a si mesmo
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Não é possível desativar sua própria conta.' });
  db.prepare('UPDATE users SET active = ? WHERE id = ? AND tenant_id = ?').run(user.active ? 0 : 1, req.params.id, req.tenantId);
  res.json({ active: !user.active });
});

router.delete('/:id', (req, res) => {
  if (req.params.id === req.user.id) return res.status(400).json({ error: 'Não é possível remover sua própria conta.' });
  const user = db.prepare('SELECT name FROM users WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
  db.prepare('DELETE FROM users WHERE id = ? AND tenant_id = ?').run(req.params.id, req.tenantId);
  logActivity(req.tenantId, `Usuário removido: ${user.name}`, 'user', req.user.id);
  res.json({ message: 'Usuário removido.' });
});

module.exports = router;
