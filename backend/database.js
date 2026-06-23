/* ═══════════════════════════════════════════════════════════════════
   SISCAR — DATABASE.JS v2.1
   Usa node:sqlite (nativo do Node.js >= 22.5) — sem dependências!
   ═══════════════════════════════════════════════════════════════════ */

const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Garante que o diretório data existe
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const DB_PATH = path.join(dataDir, 'siscar.db');
const db = new DatabaseSync(DB_PATH);

// Melhor performance
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec('PRAGMA synchronous = NORMAL');

/* ══════════════════════════════════════════════════════════════════
   SCHEMA
   ══════════════════════════════════════════════════════════════════ */
function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id          TEXT PRIMARY KEY,
      slug        TEXT UNIQUE NOT NULL,
      name        TEXT NOT NULL,
      plan        TEXT DEFAULT 'trial',
      plan_expires_at TEXT,
      active      INTEGER DEFAULT 1,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      name        TEXT NOT NULL,
      email       TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      role        TEXT DEFAULT 'vendedor',
      phone       TEXT DEFAULT '',
      active      INTEGER DEFAULT 1,
      last_login  TEXT,
      permissions TEXT DEFAULT '{}',
      created_at  TEXT DEFAULT (datetime('now')),
      UNIQUE(tenant_id, email)
    );

    CREATE TABLE IF NOT EXISTS store_config (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id   TEXT NOT NULL,
      key         TEXT NOT NULL,
      value       TEXT DEFAULT '',
      UNIQUE(tenant_id, key)
    );

    CREATE TABLE IF NOT EXISTS vehicles (
      id            TEXT PRIMARY KEY,
      tenant_id     TEXT NOT NULL,
      brand         TEXT NOT NULL DEFAULT '',
      model         TEXT NOT NULL DEFAULT '',
      year          INTEGER DEFAULT 0,
      color         TEXT DEFAULT '',
      plate         TEXT DEFAULT '',
      km            INTEGER DEFAULT 0,
      purchase_price REAL DEFAULT 0,
      sale_price    REAL DEFAULT 0,
      status        TEXT DEFAULT 'disponivel',
      category      TEXT DEFAULT '',
      fuel          TEXT DEFAULT '',
      photos        TEXT DEFAULT '[]',
      docs          TEXT DEFAULT '[]',
      notes         TEXT DEFAULT '',
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS clients (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      name        TEXT NOT NULL DEFAULT '',
      cpf         TEXT DEFAULT '',
      phone       TEXT DEFAULT '',
      email       TEXT DEFAULT '',
      city        TEXT DEFAULT '',
      state       TEXT DEFAULT '',
      address     TEXT DEFAULT '',
      notes       TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sales (
      id            TEXT PRIMARY KEY,
      tenant_id     TEXT NOT NULL,
      vehicle_id    TEXT,
      client_id     TEXT,
      date          TEXT,
      sale_price    REAL DEFAULT 0,
      payment_type  TEXT DEFAULT 'a_vista',
      financing_bank TEXT DEFAULT '',
      down_payment  REAL DEFAULT 0,
      installments  INTEGER DEFAULT 0,
      seller        TEXT DEFAULT '',
      seller_id     TEXT DEFAULT '',
      commission    REAL DEFAULT 0,
      status        TEXT DEFAULT 'concluida',
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS financials (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      type        TEXT NOT NULL,
      category    TEXT DEFAULT '',
      description TEXT DEFAULT '',
      amount      REAL DEFAULT 0,
      date        TEXT,
      status      TEXT DEFAULT 'pendente',
      sale_id     TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS evaluations (
      id            TEXT PRIMARY KEY,
      tenant_id     TEXT NOT NULL,
      vehicle       TEXT DEFAULT '',
      plate         TEXT DEFAULT '',
      client_id     TEXT,
      evaluator_id  TEXT,
      date          TEXT,
      fipe_price    REAL DEFAULT 0,
      offered_price REAL DEFAULT 0,
      status        TEXT DEFAULT 'pendente',
      notes         TEXT DEFAULT '',
      created_at    TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS vistorias (
      id           TEXT PRIMARY KEY,
      tenant_id    TEXT NOT NULL,
      vehicle_id   TEXT,
      vehicle_name TEXT DEFAULT '',
      plate        TEXT DEFAULT '',
      date         TEXT,
      inspector_id TEXT,
      status       TEXT DEFAULT 'pendente',
      checklist    TEXT DEFAULT '{}',
      photos       TEXT DEFAULT '[]',
      notes        TEXT DEFAULT '',
      created_at   TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS portals (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      name        TEXT NOT NULL DEFAULT '',
      icon        TEXT DEFAULT '',
      active      INTEGER DEFAULT 0,
      listings    INTEGER DEFAULT 0,
      views       INTEGER DEFAULT 0,
      color       TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS contracts (
      id          TEXT PRIMARY KEY,
      tenant_id   TEXT NOT NULL,
      sale_id     TEXT,
      content     TEXT DEFAULT '',
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS activities (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id   TEXT NOT NULL,
      text        TEXT DEFAULT '',
      type        TEXT DEFAULT 'system',
      user_id     TEXT,
      created_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS revoked_tokens (
      jti         TEXT PRIMARY KEY,
      revoked_at  TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_vehicles_tenant   ON vehicles(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_clients_tenant    ON clients(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_sales_tenant      ON sales(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_financials_tenant ON financials(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_tenant      ON users(tenant_id);
    CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
    CREATE INDEX IF NOT EXISTS idx_activities_tenant ON activities(tenant_id);
  `);
}

/* ══════════════════════════════════════════════════════════════════
   SEED — Cria dados demo na primeira execução
   ══════════════════════════════════════════════════════════════════ */
function seedDemo() {
  const existingTenant = db.prepare('SELECT id FROM tenants WHERE slug = ?').get('demo');
  if (existingTenant) return;

  console.log('[Siscar DB] Criando dados de demonstração...');

  const tenantId  = uuidv4();
  const adminId   = uuidv4();
  const sellerId  = uuidv4();
  const managerId = uuidv4();

  db.prepare("INSERT INTO tenants (id, slug, name, plan, active) VALUES (?, ?, ?, ?, 1)")
    .run(tenantId, 'demo', 'Siscar Veículos Demo', 'pro');

  const adminHash  = bcrypt.hashSync('123456', 10);
  const fullPerms  = JSON.stringify({ estoque:true, clientes:true, vendas:true, financeiro:true, contratos:true, avaliacoes:true, vistoria:true, integrador:true, relatorios:true, configuracoes:true, usuarios:true });
  const sellerPerms = JSON.stringify({ estoque:true, clientes:true, vendas:true, financeiro:false, contratos:true, avaliacoes:true, vistoria:true, integrador:false, relatorios:false, configuracoes:false, usuarios:false });

  const ins = db.prepare("INSERT INTO users (id,tenant_id,name,email,password_hash,role,phone,permissions) VALUES (?,?,?,?,?,?,?,?)");
  ins.run(adminId,  tenantId, 'Admin Sistema',   'admin@demo.com',  adminHash, 'admin',    '(11) 99999-0000', fullPerms);
  ins.run(sellerId, tenantId, 'Carlos Vendedor', 'carlos@demo.com', adminHash, 'vendedor', '(11) 98765-1234', sellerPerms);
  ins.run(managerId,tenantId, 'João Gerente',    'joao@demo.com',   adminHash, 'gerente',  '(11) 96543-9012', fullPerms);

  const configs = [['name','Siscar Veículos Demo'],['cnpj','12.345.678/0001-90'],['address','Av. das Nações, 1500 - São Paulo/SP'],['phone','(11) 3456-7890'],['whatsapp','(11) 99999-9999'],['email','contato@demo.com'],['website','www.siscarveiculos.com.br'],['logo',''],['commissionRate','3'],['city','São Paulo'],['state','SP']];
  const cfgStmt = db.prepare('INSERT OR IGNORE INTO store_config (tenant_id, key, value) VALUES (?,?,?)');
  configs.forEach(([k,v]) => cfgStmt.run(tenantId, k, v));

  const v1=uuidv4(),v2=uuidv4(),v3=uuidv4(),v4=uuidv4(),v5=uuidv4();
  const addV = db.prepare("INSERT INTO vehicles (id,tenant_id,brand,model,year,color,plate,km,purchase_price,sale_price,status,category,fuel,notes,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)");
  addV.run(v1,tenantId,'Toyota','Corolla',2022,'Prata','ABC-1234',32000,85000,99900,'disponivel','Sedan','Flex','Excelente estado','2024-01-15');
  addV.run(v2,tenantId,'Honda','Civic',2021,'Preto','DEF-5678',45000,88000,104900,'disponivel','Sedan','Flex','','2024-01-20');
  addV.run(v3,tenantId,'Volkswagen','T-Cross',2023,'Branco','GHI-9012',12000,110000,129900,'reservado','SUV','Flex','Reservado','2024-02-01');
  addV.run(v4,tenantId,'Jeep','Compass',2022,'Azul','JKL-3456',28000,140000,165000,'disponivel','SUV','Diesel','','2024-02-10');
  addV.run(v5,tenantId,'Chevrolet','Onix',2023,'Vermelho','MNO-7890',8000,62000,74900,'vendido','Hatch','Flex','','2024-02-15');

  const c1=uuidv4(),c2=uuidv4(),c3=uuidv4();
  const addC = db.prepare("INSERT INTO clients (id,tenant_id,name,cpf,phone,email,city,state,created_at) VALUES (?,?,?,?,?,?,?,?,?)");
  addC.run(c1,tenantId,'João Silva Santos','123.456.789-00','(11) 98765-4321','joao@email.com','São Paulo','SP','2024-01-10');
  addC.run(c2,tenantId,'Maria Fernanda Costa','987.654.321-00','(21) 97654-3210','maria@email.com','Rio de Janeiro','RJ','2024-02-05');
  addC.run(c3,tenantId,'Carlos Eduardo Lima','456.789.123-00','(31) 96543-2109','carlos@email.com','Belo Horizonte','MG','2024-02-20');

  const saleId = uuidv4();
  db.prepare("INSERT INTO sales (id,tenant_id,vehicle_id,client_id,date,sale_price,payment_type,seller,seller_id,commission,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)")
    .run(saleId,tenantId,v5,c1,'2024-03-15',74900,'financiamento','Carlos Vendedor',sellerId,2247,'concluida','2024-03-15');

  const addF = db.prepare("INSERT INTO financials (id,tenant_id,type,category,description,amount,date,status,sale_id,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)");
  addF.run(uuidv4(),tenantId,'receita','Venda de Veículo','Venda Chevrolet Onix MNO-7890',74900,'2024-03-15','recebido',saleId,'2024-03-15');
  addF.run(uuidv4(),tenantId,'receita','Venda de Veículo','Venda Honda Civic DEF-5678',104900,'2024-04-02','recebido',null,'2024-04-02');
  addF.run(uuidv4(),tenantId,'despesa','Aluguel','Aluguel do estabelecimento - Abril',4500,'2024-04-10','pago',null,'2024-04-10');
  addF.run(uuidv4(),tenantId,'despesa','Funcionários','Folha de pagamento - Abril',18000,'2024-04-30','pago',null,'2024-04-30');
  addF.run(uuidv4(),tenantId,'despesa','Marketing','Anúncios OLX e WebMotors',800,'2024-05-01','pago',null,'2024-05-01');

  const portals = [['OLX','🏷️',1,8,1248,'#7B2D8B'],['WebMotors','🚗',1,8,2145,'#E8272F'],['iCarros','🚙',1,6,879,'#00A0DC'],['Mercado Livre','🛒',1,5,3201,'#FFE600'],['Facebook','📘',1,8,1567,'#1877F2'],['SóCarrão','🚘',0,0,0,'#F7971C'],['AutoTrader','📊',1,3,421,'#FF6600'],['Classi','📰',1,4,312,'#E53935']];
  const addP = db.prepare("INSERT INTO portals (id,tenant_id,name,icon,active,listings,views,color) VALUES (?,?,?,?,?,?,?,?)");
  portals.forEach(([n,i,a,l,v,c]) => addP.run(uuidv4(),tenantId,n,i,a,l,v,c));

  const addA = db.prepare("INSERT INTO activities (tenant_id,text,type,user_id,created_at) VALUES (?,?,?,?,?)");
  addA.run(tenantId,'Venda de Chevrolet Onix concluída','sale',sellerId, new Date(Date.now()-2*3600000).toISOString());
  addA.run(tenantId,'Novo cliente cadastrado: João Silva','client',sellerId, new Date(Date.now()-3*3600000).toISOString());
  addA.run(tenantId,'Veículo Honda Civic publicado no WebMotors','portal',adminId, new Date(Date.now()-24*3600000).toISOString());

  console.log('[Siscar DB] ✅ Demo criado! Login: admin@demo.com / 123456');
}

/* ══════════════════════════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════════════════════════ */
const helpers = {
  db,
  uuid: () => uuidv4(),
  hashPassword: (p) => bcrypt.hashSync(p, 10),
  verifyPassword: (p, h) => bcrypt.compareSync(p, h),
  parseJSON: (str, fallback = []) => { try { return JSON.parse(str); } catch { return fallback; } },

  generateSlug: (name) => {
    const base = name.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = db.prepare('SELECT slug FROM tenants WHERE slug = ?').get(base);
    return existing ? `${base}-${Math.floor(1000+Math.random()*9000)}` : base;
  },

  createTenant: (name, slug, plan = 'trial') => {
    const id = uuidv4();
    const expiresAt = plan === 'trial'
      ? new Date(Date.now() + 14*24*60*60*1000).toISOString() : null;
    db.prepare('INSERT INTO tenants (id, slug, name, plan, plan_expires_at) VALUES (?,?,?,?,?)')
      .run(id, slug, name, plan, expiresAt);
    return { id, slug, name, plan, expiresAt };
  },

  isTenantActive: (tenantId) => {
    const t = db.prepare('SELECT * FROM tenants WHERE id = ?').get(tenantId);
    if (!t || !t.active) return false;
    if (t.plan === 'trial' && t.plan_expires_at && new Date() > new Date(t.plan_expires_at)) return false;
    return true;
  },

  logActivity: (tenantId, text, type = 'system', userId = null) => {
    try {
      db.prepare('INSERT INTO activities (tenant_id, text, type, user_id) VALUES (?,?,?,?)')
        .run(tenantId, text, type, userId);
    } catch(e) { /* ignora */ }
  },
};

/* ── INIT ─────────────────────────────────────────────────────────── */
initSchema();
seedDemo();

module.exports = helpers;
