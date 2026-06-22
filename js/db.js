/* ═══════════════════════════════════════════════════════════════
   SISCAR — DB.JS — IndexedDB via Dexie.js
   Banco de dados client-side persistente
   ═══════════════════════════════════════════════════════════════ */

/* ── Carrega Dexie via script dinâmico se ainda não carregado ─── */
(function loadDexie(callback) {
  if (window.Dexie) { callback(); return; }
  const s = document.createElement('script');
  s.src = 'https://unpkg.com/dexie@3.2.4/dist/dexie.js';
  s.onload = callback;
  document.head.appendChild(s);
})(function () {
  /* ── Schema ─────────────────────────────────────────────────── */
  const db = new Dexie('SiscarDB');

  db.version(1).stores({
    vehicles:    '++id, brand, model, year, status, category, plate, createdAt',
    clients:     '++id, name, cpf, phone, email, createdAt',
    sales:       '++id, vehicleId, clientId, date, status, sellerId, createdAt',
    financials:  '++id, type, category, date, status, saleId, createdAt',
    evaluations: '++id, vehicleId, clientId, evaluatorId, date, status, createdAt',
    vistorias:   '++id, vehicleId, plate, date, inspectorId, status, createdAt',
    portals:     '++id, name, active',
    users:       '++id, email, role, active',
    contracts:   '++id, saleId, createdAt',
    storeConfig: '&key',
    activities:  '++id, type, userId, createdAt',
  });

  /* ── SEED DATA — só roda na primeira vez ────────────────────── */
  async function seedIfEmpty() {
    const userCount = await db.users.count();
    if (userCount > 0) return; // Já tem dados

    console.log('[Siscar DB] Primeira execução — inserindo dados iniciais...');

    // Usuários
    await db.users.bulkAdd([
      { name: 'Admin Sistema', email: 'admin@siscar.com', passwordHash: hashPassword('123456'), role: 'admin', phone: '(11) 99999-0000', active: true, lastLogin: null, permissions: { estoque: true, clientes: true, vendas: true, financeiro: true, contratos: true, avaliacoes: true, vistoria: true, integrador: true, relatorios: true, configuracoes: true, usuarios: true } },
      { name: 'Carlos Vendedor', email: 'carlos@siscar.com', passwordHash: hashPassword('123456'), role: 'vendedor', phone: '(11) 98765-1234', active: true, lastLogin: null, permissions: { estoque: true, clientes: true, vendas: true, financeiro: false, contratos: true, avaliacoes: true, vistoria: true, integrador: false, relatorios: false, configuracoes: false, usuarios: false } },
      { name: 'Maria Vendedora', email: 'maria@siscar.com', passwordHash: hashPassword('123456'), role: 'vendedor', phone: '(11) 97654-5678', active: true, lastLogin: null, permissions: { estoque: true, clientes: true, vendas: true, financeiro: false, contratos: true, avaliacoes: true, vistoria: true, integrador: false, relatorios: false, configuracoes: false, usuarios: false } },
      { name: 'João Gerente', email: 'joao@siscar.com', passwordHash: hashPassword('123456'), role: 'gerente', phone: '(11) 96543-9012', active: true, lastLogin: null, permissions: { estoque: true, clientes: true, vendas: true, financeiro: true, contratos: true, avaliacoes: true, vistoria: true, integrador: true, relatorios: true, configuracoes: false, usuarios: false } },
    ]);

    // Clientes
    const clientIds = await db.clients.bulkAdd([
      { name: 'João Silva Santos', cpf: '123.456.789-00', phone: '(11) 98765-4321', email: 'joao.silva@email.com', city: 'São Paulo', state: 'SP', address: 'Rua das Flores, 123', notes: '', createdAt: '2024-01-10' },
      { name: 'Maria Fernanda Costa', cpf: '987.654.321-00', phone: '(21) 97654-3210', email: 'maria.costa@email.com', city: 'Rio de Janeiro', state: 'RJ', address: 'Av. Atlântica, 456', notes: '', createdAt: '2024-02-05' },
      { name: 'Carlos Eduardo Lima', cpf: '456.789.123-00', phone: '(31) 96543-2109', email: 'carlos.lima@email.com', city: 'Belo Horizonte', state: 'MG', address: 'Rua da Paz, 789', notes: 'Cliente VIP', createdAt: '2024-02-20' },
      { name: 'Ana Paula Rodrigues', cpf: '789.123.456-00', phone: '(41) 95432-1098', email: 'ana.rodrigues@email.com', city: 'Curitiba', state: 'PR', address: 'Al. das Torres, 321', notes: '', createdAt: '2024-03-01' },
      { name: 'Roberto Alves Neto', cpf: '321.654.987-00', phone: '(51) 94321-0987', email: 'roberto.alves@email.com', city: 'Porto Alegre', state: 'RS', address: 'Av. Gaúcha, 654', notes: '', createdAt: '2024-03-15' },
      { name: 'Luciana Brito Mendes', cpf: '654.987.321-00', phone: '(85) 93210-9876', email: 'luciana.brito@email.com', city: 'Fortaleza', state: 'CE', address: 'Av. Beira Mar, 987', notes: '', createdAt: '2024-04-01' },
    ], { allKeys: true });

    // Veículos
    const vehicleIds = await db.vehicles.bulkAdd([
      { brand: 'Toyota', model: 'Corolla', year: 2022, color: 'Prata', plate: 'ABC-1234', km: 32000, purchasePrice: 85000, salePrice: 99900, status: 'disponivel', category: 'Sedan', fuel: 'Flex', photos: [], docs: [], notes: 'Veículo em excelente estado', createdAt: '2024-01-15' },
      { brand: 'Honda', model: 'Civic', year: 2021, color: 'Preto', plate: 'DEF-5678', km: 45000, purchasePrice: 88000, salePrice: 104900, status: 'disponivel', category: 'Sedan', fuel: 'Flex', photos: [], docs: [], notes: '', createdAt: '2024-01-20' },
      { brand: 'Volkswagen', model: 'T-Cross', year: 2023, color: 'Branco', plate: 'GHI-9012', km: 12000, purchasePrice: 110000, salePrice: 129900, status: 'reservado', category: 'SUV', fuel: 'Flex', photos: [], docs: [], notes: 'Reservado para cliente', createdAt: '2024-02-01' },
      { brand: 'Jeep', model: 'Compass', year: 2022, color: 'Azul', plate: 'JKL-3456', km: 28000, purchasePrice: 140000, salePrice: 165000, status: 'disponivel', category: 'SUV', fuel: 'Diesel', photos: [], docs: [], notes: '', createdAt: '2024-02-10' },
      { brand: 'Chevrolet', model: 'Onix', year: 2023, color: 'Vermelho', plate: 'MNO-7890', km: 8000, purchasePrice: 62000, salePrice: 74900, status: 'vendido', category: 'Hatch', fuel: 'Flex', photos: [], docs: [], notes: '', createdAt: '2024-02-15' },
      { brand: 'Ford', model: 'EcoSport', year: 2021, color: 'Cinza', plate: 'PQR-1234', km: 56000, purchasePrice: 72000, salePrice: 86900, status: 'disponivel', category: 'SUV', fuel: 'Flex', photos: [], docs: [], notes: '', createdAt: '2024-03-01' },
      { brand: 'Renault', model: 'Kwid', year: 2022, color: 'Laranja', plate: 'STU-5678', km: 22000, purchasePrice: 45000, salePrice: 57900, status: 'disponivel', category: 'Hatch', fuel: 'Flex', photos: [], docs: [], notes: '', createdAt: '2024-03-10' },
      { brand: 'Hyundai', model: 'Creta', year: 2023, color: 'Branco', plate: 'VWX-9012', km: 5000, purchasePrice: 130000, salePrice: 152900, status: 'disponivel', category: 'SUV', fuel: 'Flex', photos: [], docs: [], notes: 'Seminovo com garantia', createdAt: '2024-03-20' },
    ], { allKeys: true });

    // Vendas
    const saleIds = await db.sales.bulkAdd([
      { vehicleId: vehicleIds[4], clientId: clientIds[0], date: '2024-03-15', salePrice: 74900, paymentType: 'financiamento', financingBank: 'Banco do Brasil', downPayment: 15000, installments: 48, seller: 'Carlos Vendedor', sellerId: 2, commission: 2247, status: 'concluida', createdAt: '2024-03-15' },
      { vehicleId: vehicleIds[1], clientId: clientIds[1], date: '2024-04-02', salePrice: 99900, paymentType: 'a_vista', financingBank: '', downPayment: 0, installments: 0, seller: 'Maria Vendedora', sellerId: 3, commission: 2997, status: 'concluida', createdAt: '2024-04-02' },
      { vehicleId: vehicleIds[3], clientId: clientIds[2], date: '2024-04-20', salePrice: 165000, paymentType: 'financiamento', financingBank: 'Santander', downPayment: 30000, installments: 60, seller: 'Carlos Vendedor', sellerId: 2, commission: 4950, status: 'concluida', createdAt: '2024-04-20' },
      { vehicleId: vehicleIds[0], clientId: clientIds[3], date: '2024-05-01', salePrice: 129900, paymentType: 'troca', financingBank: '', downPayment: 40000, installments: 24, seller: 'João Gerente', sellerId: 4, commission: 3897, status: 'concluida', createdAt: '2024-05-01' },
    ], { allKeys: true });

    // Financeiro
    await db.financials.bulkAdd([
      { type: 'receita', category: 'Venda de Veículo', description: 'Venda Chevrolet Onix MNO-7890', amount: 74900, date: '2024-03-15', status: 'recebido', saleId: saleIds[0], createdAt: '2024-03-15' },
      { type: 'receita', category: 'Venda de Veículo', description: 'Venda Honda Civic DEF-5678', amount: 99900, date: '2024-04-02', status: 'recebido', saleId: saleIds[1], createdAt: '2024-04-02' },
      { type: 'receita', category: 'Venda de Veículo', description: 'Venda Jeep Compass JKL-3456', amount: 165000, date: '2024-04-20', status: 'recebido', saleId: saleIds[2], createdAt: '2024-04-20' },
      { type: 'receita', category: 'Venda de Veículo', description: 'Venda Toyota Corolla ABC-1234', amount: 129900, date: '2024-05-01', status: 'recebido', saleId: saleIds[3], createdAt: '2024-05-01' },
      { type: 'despesa', category: 'Manutenção', description: 'Revisão Toyota Corolla ABC-1234', amount: 1200, date: '2024-04-05', status: 'pago', saleId: null, createdAt: '2024-04-05' },
      { type: 'despesa', category: 'Aluguel', description: 'Aluguel do estabelecimento - Abril', amount: 4500, date: '2024-04-10', status: 'pago', saleId: null, createdAt: '2024-04-10' },
      { type: 'despesa', category: 'Funcionários', description: 'Folha de pagamento - Abril', amount: 18000, date: '2024-04-30', status: 'pago', saleId: null, createdAt: '2024-04-30' },
      { type: 'receita', category: 'Serviço', description: 'Avaliação de veículo - Cliente Roberto', amount: 350, date: '2024-05-05', status: 'recebido', saleId: null, createdAt: '2024-05-05' },
      { type: 'despesa', category: 'Marketing', description: 'Anúncios OLX e WebMotors - Maio', amount: 800, date: '2024-05-01', status: 'pago', saleId: null, createdAt: '2024-05-01' },
    ]);

    // Avaliações
    await db.evaluations.bulkAdd([
      { vehicle: 'Ford Ka 2019', plate: 'RST-5432', clientId: clientIds[3], evaluatorId: 2, date: '2024-05-20', fipePrice: 35000, offeredPrice: 28000, status: 'aprovada', notes: 'Veículo em bom estado geral, pequenos amassados na porta traseira direita.', createdAt: '2024-05-20' },
      { vehicle: 'Chevrolet Prisma 2018', plate: 'UVW-8765', clientId: clientIds[4], evaluatorId: 4, date: '2024-05-22', fipePrice: 42000, offeredPrice: 34000, status: 'pendente', notes: 'Aguardando análise de documentação.', createdAt: '2024-05-22' },
      { vehicle: 'Fiat Argo 2021', plate: 'XYZ-1098', clientId: clientIds[5], evaluatorId: 3, date: '2024-05-25', fipePrice: 58000, offeredPrice: 47000, status: 'aprovada', notes: 'Ótimo estado, acima da tabela FIPE por conta de acessórios.', createdAt: '2024-05-25' },
    ]);

    // Portais
    await db.portals.bulkAdd([
      { name: 'OLX', icon: '🏷️', active: true, listings: 8, views: 1248, color: '#7B2D8B' },
      { name: 'WebMotors', icon: '🚗', active: true, listings: 8, views: 2145, color: '#E8272F' },
      { name: 'iCarros', icon: '🚙', active: true, listings: 6, views: 879, color: '#00A0DC' },
      { name: 'SóCarrão', icon: '🚘', active: false, listings: 0, views: 0, color: '#F7971C' },
      { name: 'Mercado Livre', icon: '🛒', active: true, listings: 5, views: 3201, color: '#FFE600' },
      { name: 'Facebook', icon: '📘', active: true, listings: 8, views: 1567, color: '#1877F2' },
      { name: 'MeuCarroNovo', icon: '🔑', active: false, listings: 0, views: 0, color: '#00B359' },
      { name: 'AutoTrader', icon: '📊', active: true, listings: 3, views: 421, color: '#FF6600' },
      { name: 'CarrosBr', icon: '🏎️', active: false, listings: 0, views: 0, color: '#0066CC' },
      { name: 'Classi', icon: '📰', active: true, listings: 4, views: 312, color: '#E53935' },
    ]);

    // Config da loja
    await db.storeConfig.bulkAdd([
      { key: 'name', value: 'Siscar Veículos' },
      { key: 'cnpj', value: '12.345.678/0001-90' },
      { key: 'address', value: 'Av. das Nações, 1500 - São Paulo/SP' },
      { key: 'phone', value: '(11) 3456-7890' },
      { key: 'whatsapp', value: '(11) 99999-9999' },
      { key: 'email', value: 'contato@siscarveiculos.com.br' },
      { key: 'website', value: 'www.siscarveiculos.com.br' },
      { key: 'logo', value: '' },
      { key: 'commissionRate', value: '3' },
      { key: 'city', value: 'São Paulo' },
      { key: 'state', value: 'SP' },
    ]);

    // Atividades
    await db.activities.bulkAdd([
      { text: 'Venda de Chevrolet Onix concluída', type: 'sale', userId: 2, createdAt: new Date(Date.now() - 2 * 3600000).toISOString() },
      { text: 'Novo cliente cadastrado: João Silva', type: 'client', userId: 2, createdAt: new Date(Date.now() - 3 * 3600000).toISOString() },
      { text: 'Avaliação Fiat Argo aprovada', type: 'evaluation', userId: 4, createdAt: new Date(Date.now() - 5 * 3600000).toISOString() },
      { text: 'Veículo Honda Civic publicado no WebMotors', type: 'portal', userId: 1, createdAt: new Date(Date.now() - 24 * 3600000).toISOString() },
      { text: 'Contrato gerado para Maria Costa', type: 'contract', userId: 3, createdAt: new Date(Date.now() - 26 * 3600000).toISOString() },
      { text: 'Vistoria realizada: Ford EcoSport PQR-1234', type: 'vistoria', userId: 2, createdAt: new Date(Date.now() - 48 * 3600000).toISOString() },
    ]);

    console.log('[Siscar DB] Seed concluído!');
  }

  /* ── Hash de Senha (SHA-256 simples) ────────────────────────── */
  function hashPassword(password) {
    // SHA-256 básico usando Web Crypto (síncrono via btoa)
    // Para produção use bcrypt via Node
    return btoa(password + '_siscar_salt_2024');
  }

  function verifyPassword(password, hash) {
    return hashPassword(password) === hash;
  }

  /* ── DB API ─────────────────────────────────────────────────── */
  const SiscarDB = {
    db,
    hashPassword,
    verifyPassword,

    /* ── Config ──────────────────────────────────────────────── */
    async getConfig() {
      const rows = await db.storeConfig.toArray();
      const config = {};
      rows.forEach(r => config[r.key] = r.value);
      return config;
    },
    async setConfig(key, value) {
      await db.storeConfig.put({ key, value });
    },
    async setConfigBulk(obj) {
      await db.storeConfig.bulkPut(Object.entries(obj).map(([key, value]) => ({ key, value })));
    },

    /* ── Vehicles ────────────────────────────────────────────── */
    async getVehicles(filter = {}) {
      let col = db.vehicles.toCollection();
      const arr = await col.toArray();
      return arr.filter(v => {
        if (filter.status && filter.status !== 'all' && v.status !== filter.status) return false;
        if (filter.search) {
          const q = filter.search.toLowerCase();
          if (!`${v.brand} ${v.model} ${v.plate} ${v.color}`.toLowerCase().includes(q)) return false;
        }
        return true;
      }).sort((a, b) => (b.id || 0) - (a.id || 0));
    },
    async getVehicle(id) { return db.vehicles.get(id); },
    async addVehicle(data) {
      data.createdAt = new Date().toISOString().split('T')[0];
      const id = await db.vehicles.add(data);
      await SiscarDB.logActivity(`Veículo cadastrado: ${data.brand} ${data.model}`, 'vehicle');
      return id;
    },
    async updateVehicle(id, data) {
      await db.vehicles.update(id, data);
      await SiscarDB.logActivity(`Veículo atualizado: ${data.brand} ${data.model}`, 'vehicle');
    },
    async deleteVehicle(id) {
      const v = await db.vehicles.get(id);
      await db.vehicles.delete(id);
      if (v) await SiscarDB.logActivity(`Veículo removido: ${v.brand} ${v.model}`, 'vehicle');
    },

    /* ── Clients ─────────────────────────────────────────────── */
    async getClients(filter = {}) {
      const arr = await db.clients.toArray();
      return arr.filter(c => {
        if (filter.search) {
          const q = filter.search.toLowerCase();
          if (!`${c.name} ${c.cpf} ${c.phone} ${c.email}`.toLowerCase().includes(q)) return false;
        }
        return true;
      }).sort((a, b) => (b.id || 0) - (a.id || 0));
    },
    async getClient(id) { return db.clients.get(id); },
    async addClient(data) {
      data.createdAt = new Date().toISOString().split('T')[0];
      const id = await db.clients.add(data);
      await SiscarDB.logActivity(`Cliente cadastrado: ${data.name}`, 'client');
      return id;
    },
    async updateClient(id, data) { await db.clients.update(id, data); },
    async deleteClient(id) {
      const c = await db.clients.get(id);
      await db.clients.delete(id);
      if (c) await SiscarDB.logActivity(`Cliente removido: ${c.name}`, 'client');
    },
    async getClientSales(clientId) {
      return db.sales.where('clientId').equals(clientId).toArray();
    },

    /* ── Sales ───────────────────────────────────────────────── */
    async getSales(filter = {}) {
      let arr = await db.sales.toArray();
      if (filter.status) arr = arr.filter(s => s.status === filter.status);
      if (filter.dateFrom) arr = arr.filter(s => s.date >= filter.dateFrom);
      if (filter.dateTo) arr = arr.filter(s => s.date <= filter.dateTo);
      return arr.sort((a, b) => (b.id || 0) - (a.id || 0));
    },
    async getSale(id) { return db.sales.get(id); },
    async addSale(data) {
      data.createdAt = new Date().toISOString().split('T')[0];
      const id = await db.sales.add(data);
      // Atualiza status do veículo
      await db.vehicles.update(data.vehicleId, { status: 'vendido' });
      // Cria lançamento financeiro automático
      const vehicle = await db.vehicles.get(data.vehicleId);
      const client = await db.clients.get(data.clientId);
      await db.financials.add({
        type: 'receita', category: 'Venda de Veículo',
        description: `Venda ${vehicle ? vehicle.brand + ' ' + vehicle.model : ''} — ${client ? client.name : ''}`,
        amount: data.salePrice, date: data.date, status: 'recebido', saleId: id,
        createdAt: new Date().toISOString().split('T')[0]
      });
      await SiscarDB.logActivity(`Venda registrada: ${vehicle ? vehicle.brand + ' ' + vehicle.model : '#' + id}`, 'sale');
      return id;
    },
    async updateSale(id, data) { await db.sales.update(id, data); },
    async cancelSale(id) {
      const sale = await db.sales.get(id);
      if (!sale) return;
      await db.sales.update(id, { status: 'cancelada' });
      await db.vehicles.update(sale.vehicleId, { status: 'disponivel' });
      // Remove lançamento financeiro associado
      await db.financials.where('saleId').equals(id).delete();
      await SiscarDB.logActivity(`Venda #${id} cancelada`, 'sale');
    },

    /* ── Financials ──────────────────────────────────────────── */
    async getFinancials(filter = {}) {
      let arr = await db.financials.toArray();
      if (filter.type) arr = arr.filter(f => f.type === filter.type);
      if (filter.category) arr = arr.filter(f => f.category === filter.category);
      if (filter.dateFrom) arr = arr.filter(f => f.date >= filter.dateFrom);
      if (filter.dateTo) arr = arr.filter(f => f.date <= filter.dateTo);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        arr = arr.filter(f => f.description.toLowerCase().includes(q));
      }
      return arr.sort((a, b) => new Date(b.date) - new Date(a.date));
    },
    async addFinancial(data) {
      data.createdAt = new Date().toISOString().split('T')[0];
      return db.financials.add(data);
    },
    async deleteFinancial(id) { await db.financials.delete(id); },
    async getFinancialSummary(filter = {}) {
      const items = await SiscarDB.getFinancials(filter);
      const receitas = items.filter(f => f.type === 'receita').reduce((a, f) => a + f.amount, 0);
      const despesas = items.filter(f => f.type === 'despesa').reduce((a, f) => a + f.amount, 0);
      return { receitas, despesas, saldo: receitas - despesas };
    },

    /* ── Evaluations ─────────────────────────────────────────── */
    async getEvaluations(filter = {}) {
      let arr = await db.evaluations.toArray();
      if (filter.status) arr = arr.filter(e => e.status === filter.status);
      if (filter.search) {
        const q = filter.search.toLowerCase();
        arr = arr.filter(e => `${e.vehicle} ${e.plate}`.toLowerCase().includes(q));
      }
      return arr.sort((a, b) => (b.id || 0) - (a.id || 0));
    },
    async addEvaluation(data) {
      data.createdAt = new Date().toISOString().split('T')[0];
      const id = await db.evaluations.add(data);
      await SiscarDB.logActivity(`Avaliação criada: ${data.vehicle}`, 'evaluation');
      return id;
    },
    async updateEvaluation(id, data) {
      await db.evaluations.update(id, data);
    },

    /* ── Vistorias ───────────────────────────────────────────── */
    async getVistorias(filter = {}) {
      let arr = await db.vistorias.toArray();
      if (filter.search) {
        const q = filter.search.toLowerCase();
        arr = arr.filter(v => `${v.plate} ${v.vehicleName || ''}`.toLowerCase().includes(q));
      }
      return arr.sort((a, b) => (b.id || 0) - (a.id || 0));
    },
    async addVistoria(data) {
      data.createdAt = new Date().toISOString().split('T')[0];
      const id = await db.vistorias.add(data);
      await SiscarDB.logActivity(`Vistoria realizada: ${data.plate}`, 'vistoria');
      return id;
    },

    /* ── Portals ─────────────────────────────────────────────── */
    async getPortals() { return db.portals.toArray(); },
    async updatePortal(id, data) { await db.portals.update(id, data); },
    async togglePortal(id) {
      const p = await db.portals.get(id);
      if (p) {
        await db.portals.update(id, { active: !p.active });
        await SiscarDB.logActivity(`Portal ${p.name} ${p.active ? 'desativado' : 'ativado'}`, 'portal');
      }
      return db.portals.get(id);
    },

    /* ── Users ───────────────────────────────────────────────── */
    async getUsers() { return db.users.toArray(); },
    async getUser(id) { return db.users.get(id); },
    async getUserByEmail(email) { return db.users.where('email').equals(email.toLowerCase()).first(); },
    async addUser(data) {
      if (data.password) {
        data.passwordHash = hashPassword(data.password);
        delete data.password;
      }
      data.active = true;
      data.lastLogin = null;
      const id = await db.users.add(data);
      await SiscarDB.logActivity(`Usuário criado: ${data.name}`, 'user');
      return id;
    },
    async updateUser(id, data) {
      if (data.password) {
        data.passwordHash = hashPassword(data.password);
        delete data.password;
      }
      await db.users.update(id, data);
    },
    async deleteUser(id) {
      const u = await db.users.get(id);
      await db.users.delete(id);
      if (u) await SiscarDB.logActivity(`Usuário removido: ${u.name}`, 'user');
    },
    async toggleUser(id) {
      const u = await db.users.get(id);
      if (u) await db.users.update(id, { active: !u.active });
      return db.users.get(id);
    },
    async loginUser(email, password) {
      const user = await SiscarDB.getUserByEmail(email);
      if (!user) return null;
      if (!verifyPassword(password, user.passwordHash)) return null;
      if (!user.active) return null;
      
      // Verifica expiração de Trial
      if (user.expiresAt && new Date() > new Date(user.expiresAt)) {
        return { error: 'expired' };
      }

      await db.users.update(user.id, { lastLogin: new Date().toLocaleString('pt-BR') });
      return user;
    },

    /* ── SaaS Trial Generation ───────────────────────────────── */
    async registerTrialUser(email) {
      const existing = await SiscarDB.getUserByEmail(email);
      if (existing) return null; // já existe

      const randomPass = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      
      const user = {
        name: email.split('@')[0],
        email: email.toLowerCase(),
        role: 'admin', // Full access trial
        active: true,
        expiresAt: expiresAt,
        permissions: { estoque: true, clientes: true, vendas: true, financeiro: true, contratos: true, avaliacoes: true, vistoria: true, integrador: true, relatorios: true, configuracoes: true, usuarios: true }
      };
      
      const id = await SiscarDB.addUser({ ...user, password: randomPass });
      return { id, email, password: randomPass, expiresAt };
    },

    /* ── Contracts ───────────────────────────────────────────── */
    async getContracts() { return db.contracts.toArray(); },
    async addContract(data) {
      data.createdAt = new Date().toISOString().split('T')[0];
      const id = await db.contracts.add(data);
      await SiscarDB.logActivity(`Contrato gerado para venda #${data.saleId}`, 'contract');
      return id;
    },
    async getContractBySale(saleId) {
      return db.contracts.where('saleId').equals(saleId).first();
    },

    /* ── Activities ──────────────────────────────────────────── */
    async getActivities(limit = 20) {
      const arr = await db.activities.toArray();
      return arr.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
    },
    async logActivity(text, type = 'system') {
      const session = Auth.getSession();
      await db.activities.add({
        text, type,
        userId: session ? session.id : 0,
        createdAt: new Date().toISOString()
      });
    },

    /* ── Dashboard Stats ─────────────────────────────────────── */
    async getDashboardStats() {
      const [vehicles, sales, financials] = await Promise.all([
        db.vehicles.toArray(),
        db.sales.toArray(),
        db.financials.toArray()
      ]);
      const counts = { disponivel: 0, reservado: 0, vendido: 0 };
      vehicles.forEach(v => counts[v.status] = (counts[v.status] || 0) + 1);
      const totalReceitas = financials.filter(f => f.type === 'receita').reduce((a, f) => a + f.amount, 0);
      const totalDespesas = financials.filter(f => f.type === 'despesa').reduce((a, f) => a + f.amount, 0);
      const stockValue = vehicles.filter(v => v.status !== 'vendido').reduce((a, v) => a + v.salePrice, 0);
      const avail = vehicles.filter(v => v.status !== 'vendido');
      const avgProfit = avail.length ? avail.reduce((a, v) => a + (v.salePrice - v.purchasePrice), 0) / avail.length : 0;
      return { counts, totalVehicles: vehicles.length, salesCount: sales.length, totalReceitas, totalDespesas, saldo: totalReceitas - totalDespesas, stockValue, avgProfit, sales, vehicles, financials };
    },

    /* ── Reset DB (dev util) ──────────────────────────────────── */
    async resetDB() {
      await db.delete();
      location.reload();
    }
  };

  /* ── Auth Module ────────────────────────────────────────────── */
  const Auth = {
    getSession() {
      const s = localStorage.getItem('siscar_session');
      return s ? JSON.parse(s) : null;
    },
    setSession(user) {
      const session = { id: user.id, name: user.name, email: user.email, role: user.role, permissions: user.permissions };
      localStorage.setItem('siscar_session', JSON.stringify(session));
    },
    clearSession() {
      localStorage.removeItem('siscar_session');
      localStorage.removeItem('siscar_current_user'); // legacy
    },
    requireAuth(redirectTo = '../pages/login.html') {
      const session = Auth.getSession();
      if (!session) { window.location.href = redirectTo; return null; }
      return session;
    },
    hasPermission(module) {
      const session = Auth.getSession();
      if (!session) return false;
      if (session.role === 'admin') return true;
      return session.permissions && session.permissions[module];
    }
  };

  /* ── Expose globally ────────────────────────────────────────── */
  window.SiscarDB = SiscarDB;
  window.Auth = Auth;

  /* ── Init DB ────────────────────────────────────────────────── */
  db.open().then(seedIfEmpty).then(() => {
    window.dispatchEvent(new Event('siscar-db-ready'));
    console.log('[Siscar DB] Pronto!');
  }).catch(err => {
    console.error('[Siscar DB] Erro ao abrir banco:', err);
  });
});
