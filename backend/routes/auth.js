/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/AUTH.JS
   Autenticação: login, registro de trial, logout, perfil
   ═══════════════════════════════════════════════════════════════════ */

const express = require('express');
const router = express.Router();
const dbHelpers = require('../database');
const { generateToken, revokeToken, requireAuth } = require('../middleware/auth');
const { db } = dbHelpers;

/* ── POST /api/v1/auth/login ──────────────────────────────────────── */
router.post('/login', (req, res) => {
  const { email, password, slug } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
  }

  // Busca usuário — se slug fornecido, restringe ao tenant
  let user;
  if (slug) {
    const tenant = db.prepare('SELECT id FROM tenants WHERE slug = ? AND active = 1').get(slug);
    if (!tenant) return res.status(404).json({ error: 'Loja não encontrada.' });
    user = db.prepare('SELECT * FROM users WHERE email = ? AND tenant_id = ? AND active = 1')
      .get(email.toLowerCase(), tenant.id);
  } else {
    user = db.prepare('SELECT * FROM users WHERE email = ? AND active = 1').get(email.toLowerCase());
  }

  if (!user) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  // Verifica senha
  if (!dbHelpers.verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'E-mail ou senha inválidos.' });
  }

  // Verifica se o tenant está ativo
  if (!dbHelpers.isTenantActive(user.tenant_id)) {
    return res.status(403).json({ error: 'Plano expirado. Renove sua assinatura para continuar.', code: 'PLAN_EXPIRED' });
  }

  // Busca info do tenant
  const tenant = db.prepare('SELECT * FROM tenants WHERE id = ?').get(user.tenant_id);

  // Atualiza último login
  db.prepare('UPDATE users SET last_login = ? WHERE id = ?')
    .run(new Date().toISOString(), user.id);

  // Gera token JWT
  const token = generateToken(user, user.tenant_id);

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      permissions: dbHelpers.parseJSON(user.permissions, {}),
    },
    tenant: {
      id: tenant.id,
      slug: tenant.slug,
      name: tenant.name,
      plan: tenant.plan,
      planExpiresAt: tenant.plan_expires_at,
    }
  });
});

/* ── POST /api/v1/auth/register — Cria nova loja (trial) ─────────── */
router.post('/register', (req, res) => {
  const { email, storeName, name } = req.body;

  if (!email || !storeName) {
    return res.status(400).json({ error: 'E-mail e nome da loja são obrigatórios.' });
  }

  // Verifica se e-mail já existe
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Este e-mail já possui uma conta. Faça login.' });
  }

  // Gera slug único para a loja
  const slug = dbHelpers.generateSlug(storeName);

  // Cria o tenant
  const tenant = dbHelpers.createTenant(storeName, slug);

  // Gera senha aleatória de 6 dígitos
  const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
  const passwordHash = dbHelpers.hashPassword(randomPass);

  const fullPerms = JSON.stringify({
    estoque: true, clientes: true, vendas: true, financeiro: true,
    contratos: true, avaliacoes: true, vistoria: true, integrador: true,
    relatorios: true, configuracoes: true, usuarios: true
  });

  // Cria usuário admin do tenant
  const userId = dbHelpers.uuid();
  db.prepare('INSERT INTO users (id, tenant_id, name, email, password_hash, role, permissions) VALUES (?,?,?,?,?,?,?)')
    .run(userId, tenant.id, name || email.split('@')[0], email.toLowerCase(), passwordHash, 'admin', fullPerms);

  // Config inicial da loja
  const configs = [
    ['name', storeName], ['email', email], ['commissionRate', '3'],
  ];
  const cfgStmt = db.prepare('INSERT OR IGNORE INTO store_config (tenant_id, key, value) VALUES (?,?,?)');
  configs.forEach(([k, v]) => cfgStmt.run(tenant.id, k, v));

  // Portais padrão
  const defaultPortals = [
    ['OLX', '🏷️', '#7B2D8B'], ['WebMotors', '🚗', '#E8272F'],
    ['iCarros', '🚙', '#00A0DC'], ['Mercado Livre', '🛒', '#FFE600'],
    ['Facebook', '📘', '#1877F2'], ['SóCarrão', '🚘', '#F7971C'],
  ];
  const addPortal = db.prepare('INSERT INTO portals (id, tenant_id, name, icon, active, color) VALUES (?,?,?,?,0,?)');
  defaultPortals.forEach(([n, i, c]) => addPortal.run(dbHelpers.uuid(), tenant.id, n, i, c));

  console.log(`[Auth] Novo tenant criado: ${slug} | ${email}`);

  res.status(201).json({
    message: 'Conta criada com sucesso! Acesse com as credenciais abaixo.',
    email: email.toLowerCase(),
    password: randomPass,
    slug,
    loginUrl: `/pages/login.html?loja=${slug}`,
    trialDays: 14,
    expiresAt: tenant.expiresAt,
  });
});

/* ── POST /api/v1/auth/logout ─────────────────────────────────────── */
router.post('/logout', requireAuth, (req, res) => {
  revokeToken(req.token);
  res.json({ message: 'Logout realizado com sucesso.' });
});

/* ── GET /api/v1/auth/me ──────────────────────────────────────────── */
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, name, email, role, phone, permissions, last_login FROM users WHERE id = ?')
    .get(req.user.id);
  if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });

  const tenant = db.prepare('SELECT id, slug, name, plan, plan_expires_at FROM tenants WHERE id = ?')
    .get(req.tenantId);

  res.json({
    user: { ...user, permissions: dbHelpers.parseJSON(user.permissions, {}) },
    tenant,
  });
});

/* ── GET /api/v1/auth/tenant/:slug — Info pública da loja ─────────── */
router.get('/tenant/:slug', (req, res) => {
  const tenant = db.prepare('SELECT id, slug, name, plan, active FROM tenants WHERE slug = ? AND active = 1')
    .get(req.params.slug);
  if (!tenant) return res.status(404).json({ error: 'Loja não encontrada.' });

  // Config pública da loja (nome, logo)
  const nameConfig = db.prepare('SELECT value FROM store_config WHERE tenant_id = ? AND key = ?')
    .get(tenant.id, 'name');
  const logoConfig = db.prepare('SELECT value FROM store_config WHERE tenant_id = ? AND key = ?')
    .get(tenant.id, 'logo');

  res.json({
    slug: tenant.slug,
    name: nameConfig?.value || tenant.name,
    logo: logoConfig?.value || '',
    plan: tenant.plan,
  });
});

module.exports = router;
