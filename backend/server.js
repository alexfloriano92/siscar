/* ═══════════════════════════════════════════════════════════════════
   SISCAR — SERVER.JS
   Servidor Express Multi-Tenant com SQLite
   ═══════════════════════════════════════════════════════════════════ */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

/* ── CORS ─────────────────────────────────────────────────────────── */
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',
  'null', // file:// protocol (abrir HTML diretamente)
];

if (process.env.FRONTEND_URL) allowedOrigins.push(process.env.FRONTEND_URL);

app.use(cors({
  origin: (origin, callback) => {
    // Permite sem origin (Postman, mobile, file://)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Em produção, adicione seu domínio em FRONTEND_URL no .env
      if (process.env.NODE_ENV === 'development') {
        callback(null, true); // Permite tudo em dev
      } else {
        callback(new Error('Origem não autorizada pelo CORS.'));
      }
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

/* ── Body Parser ──────────────────────────────────────────────────── */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* ── Serve Static Files (Frontend) ───────────────────────────────── */
// Em produção, o servidor também serve os arquivos do frontend
app.use(express.static(path.join(__dirname, '..')));

/* ── Health Check ─────────────────────────────────────────────────── */
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Siscar Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

/* ── API Routes ───────────────────────────────────────────────────── */
app.use('/api/v1/auth',        require('./routes/auth'));
app.use('/api/v1/vehicles',    require('./routes/vehicles'));
app.use('/api/v1/clients',     require('./routes/clients'));
app.use('/api/v1/sales',       require('./routes/sales'));
app.use('/api/v1/financials',  require('./routes/financials'));
app.use('/api/v1/users',       require('./routes/users'));
app.use('/api/v1/config',      require('./routes/config'));
app.use('/api/v1/portals',     require('./routes/portals'));
app.use('/api/v1/evaluations', require('./routes/evaluations'));
app.use('/api/v1/vistorias',   require('./routes/vistorias'));
app.use('/api/v1/dashboard',   require('./routes/dashboard'));

/* ── 404 Handler ──────────────────────────────────────────────────── */
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `Rota não encontrada: ${req.method} ${req.originalUrl}` });
});

/* ── SPA Fallback — serve index.html para rotas não-API ───────────── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

/* ── Error Handler Global ─────────────────────────────────────────── */
app.use((err, req, res, next) => {
  console.error('[Siscar Error]', err.message);
  if (err.message?.includes('CORS')) {
    return res.status(403).json({ error: 'Acesso negado pela política de segurança.' });
  }
  res.status(500).json({ error: 'Erro interno do servidor.', detail: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

/* ── Start ────────────────────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║          🚗  SISCAR BACKEND v2.0                 ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log(`║  Servidor: http://localhost:${PORT}                 ║`);
  console.log(`║  Ambiente: ${(process.env.NODE_ENV || 'development').padEnd(38)}║`);
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Demo Login:                                     ║');
  console.log('║    Admin:   admin@demo.com / 123456              ║');
  console.log('║    Vendedor: carlos@demo.com / 123456            ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
