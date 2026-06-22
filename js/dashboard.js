/* ═══════════════════════════════════════════════════════════════
   SISCAR — DASHBOARD.JS — Admin Panel Logic
   ═══════════════════════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  /* ── Route to page initializer ─────────────────────────────── */
  const pageInit = {
    dashboard:     initDashboard,
    estoque:       initEstoque,
    clientes:      initClientes,
    vendas:        initVendas,
    financeiro:    initFinanceiro,
    contratos:     initContratos,
    avaliacoes:    initAvaliacoes,
    vistoria:      initVistoria,
    integrador:    initIntegrador,
    relatorios:    initRelatorios,
    configuracoes: initConfiguracoes,
    usuarios:      initUsuarios,
  };

  if (pageInit[page]) pageInit[page]();
});

/* ══════════════════════════════════════════════════════════════ */
/* DASHBOARD PAGE                                                  */
/* ══════════════════════════════════════════════════════════════ */
function initDashboard() {
  renderKPIs();
  renderSalesChart();
  renderStockChart();
  renderActivity();
  renderTopVehicles();
}

function renderKPIs() {
  const counts = Utils.stockCounts();
  const kpis = [
    {
      label: 'Veículos em Estoque',
      value: Utils.formatNumber(counts.disponivel + counts.reservado),
      change: '+3 este mês', changeType: 'up',
      icon: '🚗', iconBg: 'rgba(74,157,255,0.15)', iconColor: '#4A9DFF'
    },
    {
      label: 'Vendas do Mês',
      value: SiscarData.sales.length,
      change: '+12% vs mês anterior', changeType: 'up',
      icon: '💰', iconBg: 'rgba(0,200,150,0.15)', iconColor: '#00C896'
    },
    {
      label: 'Receita Total',
      value: Utils.formatCurrency(Utils.monthlyRevenue()),
      change: '+8.3% este mês', changeType: 'up',
      icon: '📈', iconBg: 'rgba(226,36,70,0.15)', iconColor: '#E22446'
    },
    {
      label: 'Lucro Médio/Veículo',
      value: Utils.formatCurrency(Utils.avgProfit()),
      change: '+5.1% vs anterior', changeType: 'up',
      icon: '⭐', iconBg: 'rgba(255,179,0,0.15)', iconColor: '#FFB300'
    },
  ];

  const container = document.getElementById('kpi-grid');
  if (!container) return;
  container.innerHTML = kpis.map(k => `
    <div class="kpi-card" data-reveal>
      <div class="kpi-header">
        <div class="kpi-icon" style="background:${k.iconBg}; font-size:1.2rem;">${k.icon}</div>
        <span class="kpi-menu">⋯</span>
      </div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-change ${k.changeType}">
        ${k.changeType === 'up' ? '↑' : '↓'} ${k.change}
      </div>
    </div>
  `).join('');
}

function renderSalesChart() {
  const canvas = document.getElementById('sales-chart');
  if (!canvas || !window.Chart) return;

  const labels = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'];
  const data   = [4, 6, 5, 8, 7, 9];
  const rev    = [280000, 420000, 350000, 590000, 490000, 650000];

  new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Vendas',
          data,
          backgroundColor: 'rgba(226,36,70,0.7)',
          borderRadius: 6,
          yAxisID: 'y',
        },
        {
          label: 'Receita (R$)',
          data: rev,
          type: 'line',
          borderColor: '#4A9DFF',
          backgroundColor: 'rgba(74,157,255,0.1)',
          borderWidth: 2,
          pointRadius: 4,
          pointBackgroundColor: '#4A9DFF',
          tension: 0.4,
          fill: true,
          yAxisID: 'y1',
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          labels: { color: '#94A3B8', font: { family: 'Poppins', size: 12 } }
        },
        tooltip: {
          backgroundColor: '#1A1A35',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#FFF',
          bodyColor: '#94A3B8',
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#64748B' },
          position: 'left',
        },
        y1: {
          grid: { drawOnChartArea: false },
          ticks: { color: '#64748B', callback: v => 'R$ ' + (v/1000) + 'k' },
          position: 'right',
        }
      }
    }
  });
}

function renderStockChart() {
  const canvas = document.getElementById('stock-chart');
  if (!canvas || !window.Chart) return;

  const categories = {};
  SiscarData.vehicles.forEach(v => {
    if (v.status !== 'vendido') categories[v.category] = (categories[v.category] || 0) + 1;
  });

  new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: Object.keys(categories),
      datasets: [{
        data: Object.values(categories),
        backgroundColor: ['#E22446', '#4A9DFF', '#00C896', '#FFB300', '#9B59B6'],
        borderColor: 'transparent',
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { color: '#94A3B8', font: { family: 'Poppins', size: 12 }, padding: 16 }
        },
        tooltip: {
          backgroundColor: '#1A1A35',
          borderColor: 'rgba(255,255,255,0.08)',
          borderWidth: 1,
          titleColor: '#FFF',
          bodyColor: '#94A3B8',
        }
      }
    }
  });
}

function renderActivity() {
  const container = document.getElementById('activity-list');
  if (!container) return;

  const activities = [
    { text: 'Venda de Toyota Corolla concluída', time: 'há 2 horas', color: '#00C896', icon: '💰' },
    { text: 'Novo cliente cadastrado: João Silva', time: 'há 3 horas', color: '#4A9DFF', icon: '👤' },
    { text: 'Avaliação Hyundai Creta aprovada', time: 'há 5 horas', color: '#FFB300', icon: '⭐' },
    { text: 'Veículo publicado no WebMotors', time: 'há 1 dia', color: '#E22446', icon: '🌐' },
    { text: 'Contrato gerado para Maria Costa', time: 'há 1 dia', color: '#9B59B6', icon: '📄' },
    { text: 'Vistoria realizada: Ford EcoSport', time: 'há 2 dias', color: '#00C896', icon: '🔍' },
  ];

  container.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${a.color};"></div>
      <div class="activity-content">
        <div class="activity-text">${a.icon} ${a.text}</div>
        <div class="activity-time">${a.time}</div>
      </div>
    </div>
  `).join('');
}

function renderTopVehicles() {
  const container = document.getElementById('top-vehicles');
  if (!container) return;

  const vehicles = SiscarData.vehicles
    .filter(v => v.status !== 'vendido')
    .slice(0, 5);

  container.innerHTML = vehicles.map(v => `
    <div class="activity-item">
      <div style="font-size:1.4rem;">${Utils.getCategoryIcon(v.category)}</div>
      <div class="activity-content">
        <div class="activity-text">${v.brand} ${v.model} ${v.year}</div>
        <div class="activity-time">${Utils.formatCurrency(v.salePrice)} • ${Utils.formatKm(v.km)}</div>
      </div>
      ${Utils.getStatusBadge(v.status)}
    </div>
  `).join('');
}


/* ══════════════════════════════════════════════════════════════ */
/* ESTOQUE PAGE                                                    */
/* ══════════════════════════════════════════════════════════════ */
function initEstoque() {
  let viewMode = 'grid';
  let filterStatus = 'all';
  let searchQuery = '';

  renderVehicles();

  // View toggle
  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      viewMode = btn.dataset.view;
      renderVehicles();
    });
  });

  // Status filter
  document.querySelectorAll('.status-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.status-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStatus = btn.dataset.status;
      renderVehicles();
    });
  });

  // Search
  const searchInput = document.getElementById('vehicle-search');
  if (searchInput) {
    searchInput.addEventListener('input', Utils.debounce(() => {
      searchQuery = searchInput.value.toLowerCase();
      renderVehicles();
    }));
  }

  // Add button
  const addBtn = document.getElementById('btn-add-vehicle');
  if (addBtn) addBtn.addEventListener('click', () => Modal.open('modal-vehicle'));

  // Save vehicle form
  const saveBtn = document.getElementById('btn-save-vehicle');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const form = document.getElementById('form-vehicle');
      const brand = document.getElementById('v-brand')?.value;
      const model = document.getElementById('v-model')?.value;
      if (!brand || !model) {
        Toast.error('Campos obrigatórios', 'Preencha marca e modelo.');
        return;
      }
      const newV = {
        id: SiscarData.vehicles.length + 1,
        brand, model,
        year:          parseInt(document.getElementById('v-year')?.value) || 2024,
        color:         document.getElementById('v-color')?.value || '',
        plate:         document.getElementById('v-plate')?.value || '',
        km:            parseInt(document.getElementById('v-km')?.value) || 0,
        purchasePrice: parseFloat(document.getElementById('v-purchase')?.value) || 0,
        salePrice:     parseFloat(document.getElementById('v-sale')?.value) || 0,
        status:        document.getElementById('v-status')?.value || 'disponivel',
        category:      document.getElementById('v-category')?.value || 'Sedan',
        fuel:          document.getElementById('v-fuel')?.value || 'Flex',
        photos: [], docs: []
      };
      SiscarData.vehicles.push(newV);
      Modal.close('modal-vehicle');
      form?.reset();
      renderVehicles();
      Toast.success('Veículo cadastrado!', `${brand} ${model} adicionado ao estoque.`);
    });
  }

  function renderVehicles() {
    let list = [...SiscarData.vehicles];
    if (filterStatus !== 'all') list = list.filter(v => v.status === filterStatus);
    if (searchQuery) list = list.filter(v =>
      `${v.brand} ${v.model} ${v.plate}`.toLowerCase().includes(searchQuery)
    );

    const container = document.getElementById('vehicles-container');
    if (!container) return;

    if (!list.length) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <div class="empty-state-icon">🚗</div>
          <h3>Nenhum veículo encontrado</h3>
          <p>Tente ajustar os filtros ou cadastre um novo veículo.</p>
        </div>`;
      return;
    }

    if (viewMode === 'grid') {
      container.className = 'vehicles-grid';
      container.innerHTML = list.map(v => `
        <div class="vehicle-card" onclick="openVehicleDetail(${v.id})">
          <div class="vehicle-img">
            <span style="font-size:3rem;">${Utils.getCategoryIcon(v.category)}</span>
            <div class="vehicle-status">${Utils.getStatusBadge(v.status)}</div>
          </div>
          <div class="vehicle-body">
            <div class="vehicle-name">${v.brand} ${v.model} ${v.year}</div>
            <div class="vehicle-meta">
              <span>🎨 ${v.color}</span>
              <span>📍 ${v.plate}</span>
              <span>⛽ ${v.fuel}</span>
            </div>
            <div class="vehicle-meta"><span>🔢 ${Utils.formatKm(v.km)}</span></div>
            <div class="vehicle-price">${Utils.formatCurrency(v.salePrice)}</div>
            <div class="vehicle-actions">
              <button class="btn btn-primary btn-sm" style="flex:1;" onclick="event.stopPropagation(); openVehicleDetail(${v.id})">Ver detalhes</button>
              <button class="btn btn-secondary btn-icon" onclick="event.stopPropagation(); deleteVehicle(${v.id})" title="Remover">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.className = '';
      container.style.cssText = '';
      container.innerHTML = `
        <div class="table-wrapper">
          <table class="table">
            <thead><tr>
              <th>Veículo</th><th>Placa</th><th>Ano</th><th>KM</th><th>Compra</th><th>Venda</th><th>Margem</th><th>Status</th><th>Ações</th>
            </tr></thead>
            <tbody>
              ${list.map(v => `
                <tr>
                  <td><strong>${v.brand} ${v.model}</strong><br><small class="muted">${v.color} • ${v.fuel}</small></td>
                  <td>${v.plate}</td>
                  <td>${v.year}</td>
                  <td>${Utils.formatKm(v.km)}</td>
                  <td>${Utils.formatCurrency(v.purchasePrice)}</td>
                  <td><strong>${Utils.formatCurrency(v.salePrice)}</strong></td>
                  <td style="color:var(--success)">+${Utils.formatCurrency(v.salePrice - v.purchasePrice)}</td>
                  <td>${Utils.getStatusBadge(v.status)}</td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-primary btn-sm" onclick="openVehicleDetail(${v.id})">👁</button>
                      <button class="btn btn-secondary btn-sm" onclick="deleteVehicle(${v.id})">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
    }
  }

  window.openVehicleDetail = (id) => {
    const v = SiscarData.vehicles.find(x => x.id === id);
    if (!v) return;
    Toast.info(`${v.brand} ${v.model}`, Utils.formatCurrency(v.salePrice));
  };

  window.deleteVehicle = (id) => {
    if (!confirm('Remover este veículo do estoque?')) return;
    const idx = SiscarData.vehicles.findIndex(x => x.id === id);
    if (idx !== -1) {
      SiscarData.vehicles.splice(idx, 1);
      renderVehicles();
      Toast.success('Removido!', 'Veículo removido do estoque.');
    }
  };
}

/* ══════════════════════════════════════════════════════════════ */
/* CLIENTES PAGE                                                   */
/* ══════════════════════════════════════════════════════════════ */
function initClientes() {
  let searchQuery = '';
  renderClients();

  const search = document.getElementById('client-search');
  if (search) {
    search.addEventListener('input', Utils.debounce(() => {
      searchQuery = search.value.toLowerCase();
      renderClients();
    }));
  }

  const addBtn = document.getElementById('btn-add-client');
  if (addBtn) addBtn.addEventListener('click', () => Modal.open('modal-client'));

  const saveBtn = document.getElementById('btn-save-client');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const name  = document.getElementById('c-name')?.value;
      const cpf   = document.getElementById('c-cpf')?.value;
      const phone = document.getElementById('c-phone')?.value;
      if (!name || !phone) {
        Toast.error('Campos obrigatórios', 'Nome e telefone são obrigatórios.');
        return;
      }
      SiscarData.clients.push({
        id: SiscarData.clients.length + 1,
        name, cpf: cpf || '',
        phone,
        email: document.getElementById('c-email')?.value || '',
        city:  document.getElementById('c-city')?.value || '',
        state: document.getElementById('c-state')?.value || '',
        purchases: 0, lastPurchase: null, totalSpent: 0
      });
      Modal.close('modal-client');
      renderClients();
      Toast.success('Cliente cadastrado!', `${name} adicionado com sucesso.`);
    });
  }

  function renderClients() {
    let list = [...SiscarData.clients];
    if (searchQuery) list = list.filter(c =>
      `${c.name} ${c.cpf} ${c.phone}`.toLowerCase().includes(searchQuery)
    );

    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;

    tbody.innerHTML = list.map(c => {
      const initials = Utils.getInitials(c.name);
      const color = Utils.getAvatarColor(c.name);
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar avatar-sm" style="background:${color};">${initials}</div>
              <div>
                <div style="font-weight:600;">${c.name}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">${c.cpf || 'CPF não informado'}</div>
              </div>
            </div>
          </td>
          <td>${c.phone}</td>
          <td>${c.email || '-'}</td>
          <td>${c.city ? `${c.city}/${c.state}` : '-'}</td>
          <td><strong>${c.purchases}</strong></td>
          <td><strong style="color:var(--success);">${Utils.formatCurrency(c.totalSpent)}</strong></td>
          <td>${c.lastPurchase ? Utils.formatDate(c.lastPurchase) : '-'}</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-primary btn-sm" onclick="Toast.info('${c.name}', 'Abrindo histórico...')">👁</button>
              <button class="btn btn-secondary btn-sm" onclick="deleteClient(${c.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.deleteClient = (id) => {
    if (!confirm('Remover este cliente?')) return;
    const idx = SiscarData.clients.findIndex(c => c.id === id);
    if (idx !== -1) { SiscarData.clients.splice(idx, 1); renderClients(); Toast.success('Removido!', 'Cliente removido.'); }
  };
}

/* ══════════════════════════════════════════════════════════════ */
/* VENDAS PAGE                                                     */
/* ══════════════════════════════════════════════════════════════ */
function initVendas() {
  renderSalesPage();
  populateSaleSelects();

  const addBtn = document.getElementById('btn-add-sale');
  if (addBtn) addBtn.addEventListener('click', () => { populateSaleSelects(); Modal.open('modal-sale'); });

  const saveBtn = document.getElementById('btn-save-sale');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const vehicleId = parseInt(document.getElementById('s-vehicle')?.value);
      const clientId  = parseInt(document.getElementById('s-client')?.value);
      const price     = parseFloat(document.getElementById('s-price')?.value);
      if (!vehicleId || !clientId || !price) {
        Toast.error('Campos obrigatórios', 'Selecione veículo, cliente e preço.');
        return;
      }
      const vehicle = SiscarData.vehicles.find(v => v.id === vehicleId);
      if (vehicle) vehicle.status = 'vendido';
      SiscarData.sales.push({
        id: SiscarData.sales.length + 1,
        vehicleId, clientId,
        date: new Date().toISOString().split('T')[0],
        salePrice: price,
        paymentType: document.getElementById('s-payment')?.value || 'a_vista',
        financingBank: document.getElementById('s-bank')?.value || '',
        downPayment: parseFloat(document.getElementById('s-down')?.value) || 0,
        installments: parseInt(document.getElementById('s-installments')?.value) || 0,
        seller: 'Carlos Vendedor',
        commission: Math.round(price * 0.03),
        status: 'concluida'
      });
      Modal.close('modal-sale');
      renderSalesPage();
      Toast.success('Venda registrada!', Utils.formatCurrency(price));
    });
  }

  function populateSaleSelects() {
    const vSel = document.getElementById('s-vehicle');
    const cSel = document.getElementById('s-client');
    if (vSel) {
      vSel.innerHTML = '<option value="">Selecione um veículo...</option>' +
        SiscarData.vehicles.filter(v => v.status === 'disponivel').map(v =>
          `<option value="${v.id}">${v.brand} ${v.model} ${v.year} — ${v.plate}</option>`
        ).join('');
    }
    if (cSel) {
      cSel.innerHTML = '<option value="">Selecione um cliente...</option>' +
        SiscarData.clients.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
    }
  }

  function renderSalesPage() {
    const tbody = document.getElementById('sales-tbody');
    if (!tbody) return;
    tbody.innerHTML = SiscarData.sales.map(s => {
      const v = SiscarData.vehicles.find(x => x.id === s.vehicleId);
      const c = SiscarData.clients.find(x => x.id === s.clientId);
      return `
        <tr>
          <td><strong>#${s.id.toString().padStart(4,'0')}</strong></td>
          <td>${v ? `${v.brand} ${v.model}` : '-'}</td>
          <td>${c ? c.name : '-'}</td>
          <td>${Utils.formatDate(s.date)}</td>
          <td><strong>${Utils.formatCurrency(s.salePrice)}</strong></td>
          <td>${s.paymentType === 'a_vista' ? 'À Vista' : s.paymentType === 'financiamento' ? 'Financiamento' : 'Troca'}</td>
          <td>${s.seller}</td>
          <td style="color:var(--success)">${Utils.formatCurrency(s.commission)}</td>
          <td>${Utils.getStatusBadge(s.status)}</td>
          <td>
            <button class="btn btn-primary btn-sm" onclick="Toast.info('Contrato','Abrindo contrato da venda #${s.id}...')">📄 Contrato</button>
          </td>
        </tr>`;
    }).join('');
  }
}

/* ══════════════════════════════════════════════════════════════ */
/* FINANCEIRO PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
function initFinanceiro() {
  const totalReceitas = SiscarData.financials.filter(f => f.type === 'receita').reduce((a,f) => a + f.amount, 0);
  const totalDespesas = SiscarData.financials.filter(f => f.type === 'despesa').reduce((a,f) => a + f.amount, 0);
  const saldo = totalReceitas - totalDespesas;

  const recEl = document.getElementById('fin-receita');
  const desEl = document.getElementById('fin-despesa');
  const salEl = document.getElementById('fin-saldo');
  if (recEl) recEl.textContent = Utils.formatCurrency(totalReceitas);
  if (desEl) desEl.textContent = Utils.formatCurrency(totalDespesas);
  if (salEl) salEl.textContent = Utils.formatCurrency(saldo);

  renderFinancials();
  renderCashflowChart();

  const addBtn = document.getElementById('btn-add-financial');
  if (addBtn) addBtn.addEventListener('click', () => Modal.open('modal-financial'));

  const saveBtn = document.getElementById('btn-save-financial');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const type   = document.getElementById('f-type')?.value;
      const desc   = document.getElementById('f-desc')?.value;
      const amount = parseFloat(document.getElementById('f-amount')?.value);
      if (!type || !desc || !amount) { Toast.error('Preencha todos os campos', ''); return; }
      SiscarData.financials.push({
        id: SiscarData.financials.length + 1,
        type, category: document.getElementById('f-category')?.value || 'Outros',
        description: desc, amount,
        date: document.getElementById('f-date')?.value || new Date().toISOString().split('T')[0],
        status: type === 'receita' ? 'recebido' : 'pago'
      });
      Modal.close('modal-financial');
      renderFinancials();
      Toast.success('Lançamento adicionado!', Utils.formatCurrency(amount));
    });
  }

  function renderFinancials() {
    const tbody = document.getElementById('financials-tbody');
    if (!tbody) return;
    tbody.innerHTML = SiscarData.financials.map(f => `
      <tr>
        <td>${Utils.formatDate(f.date)}</td>
        <td><span class="badge ${f.type === 'receita' ? 'badge-success' : 'badge-danger'}">${f.type === 'receita' ? '↑ Receita' : '↓ Despesa'}</span></td>
        <td>${f.category}</td>
        <td>${f.description}</td>
        <td style="color:${f.type === 'receita' ? 'var(--success)' : 'var(--danger)'};font-weight:700;">
          ${f.type === 'receita' ? '+' : '-'}${Utils.formatCurrency(f.amount)}
        </td>
        <td>${Utils.getStatusBadge(f.status)}</td>
        <td><button class="btn btn-secondary btn-sm" onclick="deleteFinancial(${f.id})">🗑️</button></td>
      </tr>
    `).join('');
  }

  window.deleteFinancial = (id) => {
    const idx = SiscarData.financials.findIndex(f => f.id === id);
    if (idx !== -1) { SiscarData.financials.splice(idx, 1); renderFinancials(); Toast.success('Removido!', ''); }
  };

  function renderCashflowChart() {
    const canvas = document.getElementById('cashflow-chart');
    if (!canvas || !window.Chart) return;
    new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Jan','Fev','Mar','Abr','Mai','Jun'],
        datasets: [
          { label: 'Receitas', data: [220000,310000,280000,420000,380000,510000], borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.1)', fill: true, tension: 0.4 },
          { label: 'Despesas', data: [80000,95000,88000,102000,97000,110000], borderColor: '#FF4D4D', backgroundColor: 'rgba(255,77,77,0.1)', fill: true, tension: 0.4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'Poppins', size: 12 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: v => 'R$ '+(v/1000)+'k' } }
        }
      }
    });
  }
}

/* ══════════════════════════════════════════════════════════════ */
/* CONTRATOS PAGE                                                  */
/* ══════════════════════════════════════════════════════════════ */
function initContratos() {
  populateContractSelects();

  const genBtn = document.getElementById('btn-generate-contract');
  if (genBtn) {
    genBtn.addEventListener('click', () => {
      const saleId = document.getElementById('contract-sale')?.value;
      if (!saleId) { Toast.error('Selecione uma venda', ''); return; }
      const sale = SiscarData.sales.find(s => s.id === parseInt(saleId));
      const vehicle = SiscarData.vehicles.find(v => v.id === sale?.vehicleId);
      const client = SiscarData.clients.find(c => c.id === sale?.clientId);
      if (sale && vehicle && client) {
        renderContractPreview(sale, vehicle, client);
        Toast.success('Contrato gerado!', 'Pronto para impressão.');
      }
    });
  }

  const printBtn = document.getElementById('btn-print-contract');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
      Toast.success('Imprimindo...', 'Verifique a impressora.');
    });
  }

  function populateContractSelects() {
    const sel = document.getElementById('contract-sale');
    if (sel) {
      sel.innerHTML = '<option value="">Selecione uma venda...</option>' +
        SiscarData.sales.map(s => {
          const v = SiscarData.vehicles.find(x => x.id === s.vehicleId);
          const c = SiscarData.clients.find(x => x.id === s.clientId);
          return `<option value="${s.id}">#${s.id.toString().padStart(4,'0')} — ${v ? v.brand+' '+v.model : '?'} | ${c ? c.name : '?'}</option>`;
        }).join('');
    }
  }

  function renderContractPreview(sale, vehicle, client) {
    const preview = document.getElementById('contract-preview');
    if (!preview) return;
    const store = SiscarData.storeConfig;
    const paymentText = sale.paymentType === 'a_vista'
      ? `À Vista — ${Utils.formatCurrency(sale.salePrice)}`
      : `Financiamento — Entrada: ${Utils.formatCurrency(sale.downPayment)} + ${sale.installments}x parcelas`;

    preview.innerHTML = `
      <div class="contract-preview">
        <h1>Contrato de Compra e Venda de Veículo</h1>
        <div class="contract-section">
          <h3>1. Vendedor (Parte A)</h3>
          <p><strong>${store.name}</strong><br>
          CNPJ: ${store.cnpj}<br>
          Endereço: ${store.address}<br>
          Telefone: ${store.phone}</p>
        </div>
        <div class="contract-section">
          <h3>2. Comprador (Parte B)</h3>
          <p><strong>${client.name}</strong><br>
          CPF: ${client.cpf}<br>
          Telefone: ${client.phone}<br>
          ${client.email ? 'E-mail: '+client.email : ''}</p>
        </div>
        <div class="contract-section">
          <h3>3. Veículo</h3>
          <p><strong>${vehicle.brand} ${vehicle.model} ${vehicle.year}</strong><br>
          Placa: ${vehicle.plate} | Cor: ${vehicle.color}<br>
          Combustível: ${vehicle.fuel} | KM: ${Utils.formatKm(vehicle.km)}</p>
        </div>
        <div class="contract-section">
          <h3>4. Condições de Pagamento</h3>
          <p>Valor Total: <strong>${Utils.formatCurrency(sale.salePrice)}</strong><br>
          Forma de Pagamento: ${paymentText}<br>
          ${sale.financingBank ? 'Instituição Financeira: '+sale.financingBank : ''}</p>
        </div>
        <div class="contract-section">
          <h3>5. Declarações</h3>
          <p>A Parte A declara que o veículo está em boas condições e livre de quaisquer ônus, débitos ou gravames. A Parte B declara que inspecionou o veículo e está de acordo com seu estado de conservação.</p>
        </div>
        <p style="text-align:center;color:#666;margin-top:20px;">
          São Paulo, ${Utils.formatDate(sale.date)}
        </p>
        <div class="contract-signatures">
          <div class="signature-line">
            <p><strong>${store.name}</strong><br>Vendedor</p>
          </div>
          <div class="signature-line">
            <p><strong>${client.name}</strong><br>Comprador</p>
          </div>
        </div>
      </div>
    `;
  }
}

/* ══════════════════════════════════════════════════════════════ */
/* AVALIAÇÕES PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
function initAvaliacoes() {
  renderEvaluations();

  const addBtn = document.getElementById('btn-add-evaluation');
  if (addBtn) addBtn.addEventListener('click', () => Modal.open('modal-evaluation'));

  const saveBtn = document.getElementById('btn-save-evaluation');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const vehicle = document.getElementById('e-vehicle')?.value;
      const plate   = document.getElementById('e-plate')?.value;
      const client  = document.getElementById('e-client')?.value;
      if (!vehicle || !client) { Toast.error('Campos obrigatórios', ''); return; }
      SiscarData.evaluations.push({
        id: SiscarData.evaluations.length + 1,
        vehicle, plate: plate || '', client,
        evaluator: 'Carlos Vendedor',
        date: new Date().toISOString().split('T')[0],
        fipePrice:    parseFloat(document.getElementById('e-fipe')?.value) || 0,
        offeredPrice: parseFloat(document.getElementById('e-offered')?.value) || 0,
        status: 'pendente',
        notes: document.getElementById('e-notes')?.value || ''
      });
      Modal.close('modal-evaluation');
      renderEvaluations();
      Toast.success('Avaliação criada!', `${vehicle} aguardando aprovação.`);
    });
  }

  function renderEvaluations() {
    const tbody = document.getElementById('evaluations-tbody');
    if (!tbody) return;
    tbody.innerHTML = SiscarData.evaluations.map(e => `
      <tr>
        <td><strong>${e.vehicle}</strong><br><small class="muted">${e.plate}</small></td>
        <td>${e.client}</td>
        <td>${e.evaluator}</td>
        <td>${Utils.formatDate(e.date)}</td>
        <td>${Utils.formatCurrency(e.fipePrice)}</td>
        <td><strong>${Utils.formatCurrency(e.offeredPrice)}</strong></td>
        <td style="color:${e.offeredPrice < e.fipePrice ? 'var(--success)' : 'var(--warning)'}">
          ${Math.round((1 - e.offeredPrice/e.fipePrice)*100)}% abaixo FIPE
        </td>
        <td>${Utils.getStatusBadge(e.status)}</td>
        <td>
          <div style="display:flex;gap:6px;">
            ${e.status === 'pendente' ? `
              <button class="btn btn-success btn-sm" onclick="approveEval(${e.id})">✅ Aprovar</button>
              <button class="btn btn-secondary btn-sm" onclick="rejectEval(${e.id})">❌</button>
            ` : '<span style="color:var(--text-muted);font-size:0.8rem;">Finalizada</span>'}
          </div>
        </td>
      </tr>
    `).join('');
  }

  window.approveEval = (id) => {
    const ev = SiscarData.evaluations.find(e => e.id === id);
    if (ev) { ev.status = 'aprovada'; renderEvaluations(); Toast.success('Avaliação aprovada!', ev.vehicle); }
  };

  window.rejectEval = (id) => {
    const ev = SiscarData.evaluations.find(e => e.id === id);
    if (ev) { ev.status = 'recusada'; renderEvaluations(); Toast.warning('Avaliação recusada.', ev.vehicle); }
  };
}

/* ══════════════════════════════════════════════════════════════ */
/* VISTORIA PAGE                                                   */
/* ══════════════════════════════════════════════════════════════ */
function initVistoria() {
  const items = document.querySelectorAll('.check-option');
  items.forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.check-options');
      group.querySelectorAll('.check-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  const finBtn = document.getElementById('btn-finish-vistoria');
  if (finBtn) {
    finBtn.addEventListener('click', () => {
      let ok = 0, att = 0, prob = 0;
      document.querySelectorAll('.check-option.active').forEach(b => {
        if (b.classList.contains('ok')) ok++;
        else if (b.classList.contains('atention')) att++;
        else if (b.classList.contains('problem')) prob++;
      });
      Toast.success('Vistoria finalizada!', `✅ ${ok} OK | ⚠️ ${att} Atenção | ❌ ${prob} Problemas`);
    });
  }
}

/* ══════════════════════════════════════════════════════════════ */
/* INTEGRADOR PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
function initIntegrador() {
  renderPortals();

  function renderPortals() {
    const container = document.getElementById('portals-container');
    if (!container) return;
    container.innerHTML = SiscarData.portals.map(p => `
      <div class="portal-admin-card ${p.active ? 'active' : ''}">
        <div class="portal-admin-logo">${p.icon}</div>
        <div class="portal-admin-name">${p.name}</div>
        <div class="portal-admin-stats">
          ${p.active ? `${p.listings} anúncios • ${p.views.toLocaleString('pt-BR')} views` : 'Inativo'}
        </div>
        <label class="toggle" onclick="togglePortal(${p.id})">
          <div class="toggle-track ${p.active ? 'on' : ''}">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label">${p.active ? 'Ativo' : 'Inativo'}</span>
        </label>
      </div>
    `).join('');
  }

  window.togglePortal = (id) => {
    const portal = SiscarData.portals.find(p => p.id === id);
    if (portal) {
      portal.active = !portal.active;
      renderPortals();
      Toast.info(portal.name, portal.active ? 'Integração ativada!' : 'Integração desativada.');
    }
  };
}

/* ══════════════════════════════════════════════════════════════ */
/* RELATÓRIOS PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
function initRelatorios() {
  renderReportCharts();

  const exportBtn = document.getElementById('btn-export-report');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => Toast.success('Exportando...', 'Relatório sendo preparado para download.'));
  }

  function renderReportCharts() {
    const c1 = document.getElementById('report-chart-1');
    const c2 = document.getElementById('report-chart-2');
    const c3 = document.getElementById('report-chart-3');
    const c4 = document.getElementById('report-chart-4');
    if (!window.Chart) return;

    const chartDefaults = {
      plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'Poppins', size: 11 } } } },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } }
      }
    };

    if (c1) new Chart(c1, { type: 'bar', data: { labels: ['Jan','Fev','Mar','Abr','Mai','Jun'], datasets: [{ label: 'Veículos Vendidos', data: [4,6,5,8,7,9], backgroundColor: '#E22446', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, ...chartDefaults } });
    if (c2) new Chart(c2, { type: 'line', data: { labels: ['Jan','Fev','Mar','Abr','Mai','Jun'], datasets: [{ label: 'Receita (R$)', data: [280000,420000,350000,590000,490000,650000], borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: chartDefaults.plugins, scales: { x: chartDefaults.scales.x, y: { ...chartDefaults.scales.y, ticks: { color: '#64748B', callback: v => 'R$ '+(v/1000)+'k' } } } } });
    if (c3) new Chart(c3, { type: 'pie', data: { labels: ['OLX','WebMotors','Mercado Livre','Facebook','Outros'], datasets: [{ data: [22,35,20,15,8], backgroundColor: ['#7B2D8B','#E8272F','#FFE600','#1877F2','#64748B'], borderColor: 'transparent' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family:'Poppins', size:11 } } } } } });
    if (c4) new Chart(c4, { type: 'bar', data: { labels: ['Sedan','SUV','Hatch','Pickup','Van'], datasets: [{ label: 'Estoque', data: [2,4,2,0,0], backgroundColor: '#4A9DFF', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, ...chartDefaults } });
  }
}

/* ══════════════════════════════════════════════════════════════ */
/* CONFIGURAÇÕES PAGE                                              */
/* ══════════════════════════════════════════════════════════════ */
function initConfiguracoes() {
  // Pre-fill form
  const config = SiscarData.storeConfig;
  const fieldMap = { 'cfg-name': 'name', 'cfg-cnpj': 'cnpj', 'cfg-address': 'address', 'cfg-phone': 'phone', 'cfg-whatsapp': 'whatsapp', 'cfg-email': 'email', 'cfg-website': 'website', 'cfg-commission': 'commissionRate' };
  for (const [id, key] of Object.entries(fieldMap)) {
    const el = document.getElementById(id);
    if (el) el.value = config[key] || '';
  }

  const saveBtn = document.getElementById('btn-save-config');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      for (const [id, key] of Object.entries(fieldMap)) {
        const el = document.getElementById(id);
        if (el) SiscarData.storeConfig[key] = el.value;
      }
      Toast.success('Configurações salvas!', 'As alterações foram salvas com sucesso.');
    });
  }
}

/* ══════════════════════════════════════════════════════════════ */
/* USUÁRIOS PAGE                                                   */
/* ══════════════════════════════════════════════════════════════ */
function initUsuarios() {
  renderUsers();

  const addBtn = document.getElementById('btn-add-user');
  if (addBtn) addBtn.addEventListener('click', () => Modal.open('modal-user'));

  const saveBtn = document.getElementById('btn-save-user');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => {
      const name  = document.getElementById('u-name')?.value;
      const email = document.getElementById('u-email')?.value;
      const role  = document.getElementById('u-role')?.value;
      if (!name || !email) { Toast.error('Campos obrigatórios', ''); return; }
      SiscarData.users.push({
        id: SiscarData.users.length + 1, name, email, role: role || 'vendedor',
        phone: document.getElementById('u-phone')?.value || '',
        active: true, lastLogin: 'Nunca',
        permissions: { estoque: true, clientes: true, vendas: true, financeiro: false, contratos: true, avaliacoes: false, vistoria: false, integrador: false, relatorios: false, configuracoes: false, usuarios: false }
      });
      Modal.close('modal-user');
      renderUsers();
      Toast.success('Usuário criado!', `${name} pode acessar o sistema.`);
    });
  }

  function renderUsers() {
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = SiscarData.users.map(u => {
      const initials = Utils.getInitials(u.name);
      const color = Utils.getAvatarColor(u.name);
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar avatar-sm" style="background:${color};">${initials}</div>
              <div>
                <div style="font-weight:600;">${u.name}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">${u.email}</div>
              </div>
            </div>
          </td>
          <td>${Utils.getRoleBadge(u.role)}</td>
          <td>${u.phone || '-'}</td>
          <td>${u.lastLogin}</td>
          <td><span class="badge ${u.active ? 'badge-success' : 'badge-muted'}">${u.active ? 'Ativo' : 'Inativo'}</span></td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-primary btn-sm" onclick="toggleUser(${u.id})">${u.active ? '🔒 Desativar' : '🔓 Ativar'}</button>
              ${u.id !== 1 ? `<button class="btn btn-secondary btn-sm" onclick="deleteUser(${u.id})">🗑️</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.toggleUser = (id) => {
    const u = SiscarData.users.find(x => x.id === id);
    if (u) { u.active = !u.active; renderUsers(); Toast.info(u.name, u.active ? 'Usuário ativado.' : 'Usuário desativado.'); }
  };

  window.deleteUser = (id) => {
    if (!confirm('Remover este usuário?')) return;
    const idx = SiscarData.users.findIndex(x => x.id === id);
    if (idx !== -1) { SiscarData.users.splice(idx, 1); renderUsers(); Toast.success('Removido!', ''); }
  };
}
