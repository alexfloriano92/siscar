/* ═══════════════════════════════════════════════════════════════════
   SISCAR — MIDDLEWARE/AUTH.JS
   Verifica o token JWT e injeta req.user
   ═══════════════════════════════════════════════════════════════════ */

const jwt = require('jsonwebtoken');
const { db } = require('../database');

const JWT_SECRET = process.env.JWT_SECRET || 'siscar_super_secret_jwt_key_2024_change_in_production';

/**
 * Middleware de autenticação obrigatória.
 * Rejeita requisições sem token JWT válido.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
  }

  const token = authHeader.substring(7);

  // Verifica se o token foi revogado (logout)
  const revoked = db.prepare('SELECT jti FROM revoked_tokens WHERE jti = ?').get(token.substring(0, 36));
  if (revoked) {
    return res.status(401).json({ error: 'Token inválido ou sessão encerrada.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    req.tenantId = decoded.tenantId;
    req.token = token;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sessão expirada. Faça login novamente.', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token inválido.' });
  }
}

/**
 * Middleware que verifica se o usuário tem permissão em um módulo específico.
 */
function requirePermission(module) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Não autenticado.' });
    if (req.user.role === 'admin') return next(); // Admin tem acesso total

    const perms = req.user.permissions || {};
    if (!perms[module]) {
      return res.status(403).json({ error: `Sem permissão para acessar o módulo: ${module}` });
    }
    next();
  };
}

/**
 * Gera um token JWT para o usuário.
 */
function generateToken(user, tenantId) {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions ? JSON.parse(user.permissions) : {},
      tenantId,
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

/**
 * Revoga um token (para logout).
 */
function revokeToken(token) {
  try {
    const jti = token.substring(0, 36);
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (jti) VALUES (?)').run(jti);
  } catch (e) { /* ignora */ }
}

module.exports = { requireAuth, requirePermission, generateToken, revokeToken, JWT_SECRET };
