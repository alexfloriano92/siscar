/* ═══════════════════════════════════════════════════════════════
   SISCAR — DASHBOARD.JS v2.0 — Multi-Tenant SaaS
   Usa SiscarAPI (api.js) que é retrocompatível com SiscarDB
   ═══════════════════════════════════════════════════════════════ */

function waitDB(fn) {
  if (window.SiscarDB) { fn(); return; }
  window.addEventListener('siscar-db-ready', fn, { once: true });
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page;

  // Guarda de autenticação global — todas as páginas do painel
  if (window.Auth && !Auth.getSession() && page) {
    window.location.href = '../pages/login.html';
    return;
  }

  const pageInit = {
    dashboard:     () => waitDB(initDashboard),
    estoque:       () => waitDB(initEstoque),
    clientes:      () => waitDB(initClientes),
    vendas:        () => waitDB(initVendas),
    financeiro:    () => waitDB(initFinanceiro),
    contratos:     () => waitDB(initContratos),
    avaliacoes:    () => waitDB(initAvaliacoes),
    vistoria:      () => waitDB(initVistoria),
    integrador:    () => waitDB(initIntegrador),
    relatorios:    () => waitDB(initRelatorios),
    configuracoes: () => waitDB(initConfiguracoes),
    usuarios:      () => waitDB(initUsuarios),
  };

  if (pageInit[page]) pageInit[page]();
});

/* ══════════════════════════════════════════════════════════════ */
/* DASHBOARD PAGE                                                  */
/* ══════════════════════════════════════════════════════════════ */
async function initDashboard() {
  // Atualiza saudação com nome do usuário logado
  const session = window.Auth?.getSession?.();
  if (session) {
    const welcomeEl = document.getElementById('welcome-name');
    if (welcomeEl) welcomeEl.textContent = session.user?.name?.split(' ')[0] || 'Admin';
    const breadcrumb = document.querySelector('.breadcrumb a');
    if (breadcrumb) breadcrumb.textContent = session.user?.name || 'Admin';
  }

  try {
    const stats = await SiscarDB.getDashboardStats();
    renderKPIs(stats);
    renderSalesChart(stats);
    renderStockChart(stats);
    renderActivity(stats);
    renderTopVehicles(stats);
  } catch (err) {
    console.error('[Dashboard] Erro ao carregar stats:', err);
    if (window.Toast) Toast.error('Erro', 'Falha ao carregar dados. ' + (err.message || ''));
  }
}

function renderKPIs(stats) {
  const kpis = [
    {
      label: 'Veículos em Estoque',
      value: Utils.formatNumber((stats.counts?.disponivel || 0) + (stats.counts?.reservado || 0)),
      change: `${stats.counts?.disponivel || 0} disponíveis`,
      changeType: 'up', icon: '🚗', iconBg: 'rgba(74,157,255,0.15)', iconColor: '#4A9DFF'
    },
    {
      label: 'Vendas no Mês',
      value: stats.monthlySalesCount || stats.salesCount || 0,
      change: Utils.formatCurrency(stats.monthlySalesTotal || stats.totalReceitas || 0),
      changeType: 'up', icon: '💰', iconBg: 'rgba(0,200,150,0.15)', iconColor: '#00C896'
    },
    {
      label: 'Receita do Mês',
      value: Utils.formatCurrency(stats.monthReceitas || stats.totalReceitas || 0),
      change: `Saldo: ${Utils.formatCurrency(stats.monthSaldo || stats.saldo || 0)}`,
      changeType: 'up', icon: '📈', iconBg: 'rgba(226,36,70,0.15)', iconColor: '#E22446'
    },
    {
      label: 'Lucro Médio/Veículo',
      value: Utils.formatCurrency(stats.avgProfit || 0),
      change: `Estoque: ${Utils.formatCurrency(stats.stockValue || 0)}`,
      changeType: 'up', icon: '⭐', iconBg: 'rgba(255,179,0,0.15)', iconColor: '#FFB300'
    },
  ];

  const container = document.getElementById('kpi-grid');
  if (!container) return;
  container.innerHTML = kpis.map(k => `
    <div class="kpi-card">
      <div class="kpi-header">
        <div class="kpi-icon" style="background:${k.iconBg}; font-size:1.2rem;">${k.icon}</div>
        <span class="kpi-menu">⋯</span>
      </div>
      <div class="kpi-value">${k.value}</div>
      <div class="kpi-label">${k.label}</div>
      <div class="kpi-change ${k.changeType}">↑ ${k.change}</div>
    </div>
  `).join('');
}

function renderSalesChart(stats) {
  const canvas = document.getElementById('sales-chart');
  if (!canvas || !window.Chart) return;

  let labels, rev;

  if (stats.chartData && stats.chartData.length > 0) {
    labels = stats.chartData.map(d => d.month);
    rev    = stats.chartData.map(d => d.total);
  } else {
    const revData = {};
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    (stats.sales || []).forEach(s => {
      if (!s.date) return;
      const m = parseInt(s.date.split('-')[1]) - 1;
      revData[m] = (revData[m] || 0) + (s.sale_price || s.salePrice || 0);
    });
    labels = months.slice(0, new Date().getMonth() + 1);
    rev    = labels.map((_, i) => revData[i] || 0);
  }

  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label: 'Receita (R$)', data: rev, backgroundColor: 'rgba(226,36,70,0.75)', borderRadius: 8, yAxisID: 'y' },
        { label: 'Tendência', data: rev, type: 'line', borderColor: '#4A9DFF', backgroundColor: 'rgba(74,157,255,0.08)', borderWidth: 2, pointRadius: 4, pointBackgroundColor: '#4A9DFF', tension: 0.4, fill: true, yAxisID: 'y' }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { labels: { color: '#94A3B8', font: { family: 'Poppins', size: 12 } } },
        tooltip: { backgroundColor: '#1A1A35', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#FFF', bodyColor: '#94A3B8' }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } },
        y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k' } },
      }
    }
  });
}

function renderStockChart(stats) {
  const canvas = document.getElementById('stock-chart');
  if (!canvas || !window.Chart) return;

  const counts = stats.counts || {};
  const labels = ['Disponível', 'Reservado', 'Vendido'];
  const data   = [counts.disponivel || 0, counts.reservado || 0, counts.vendido || 0];

  if (canvas._chart) canvas._chart.destroy();
  canvas._chart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels,
      datasets: [{ data, backgroundColor: ['#00C896', '#FFB300', '#4A9DFF'], borderColor: 'transparent', borderWidth: 0, hoverOffset: 8 }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '70%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94A3B8', font: { family: 'Poppins', size: 12 }, padding: 16 } },
        tooltip: { backgroundColor: '#1A1A35', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, titleColor: '#FFF', bodyColor: '#94A3B8' }
      }
    }
  });
}

async function renderActivity(stats) {
  const container = document.getElementById('activity-list');
  if (!container) return;

  const activities = stats?.recentActivities || [];
  const typeIcons  = { sale: '💰', client: '👤', evaluation: '⭐', portal: '🌐', contract: '📄', vistoria: '🔍', vehicle: '🚗', user: '👤', system: 'ℹ️', financial: '📊', config: '⚙️' };
  const typeColors = { sale: '#00C896', client: '#4A9DFF', evaluation: '#FFB300', portal: '#E22446', contract: '#9B59B6', vistoria: '#00C896', vehicle: '#4A9DFF', user: '#FFB300', system: '#64748B', financial: '#FF6600', config: '#64748B' };

  container.innerHTML = activities.map(a => `
    <div class="activity-item">
      <div class="activity-dot" style="background:${typeColors[a.type] || '#64748B'};"></div>
      <div class="activity-content">
        <div class="activity-text">${typeIcons[a.type] || 'ℹ️'} ${Utils.safe(a.text)}</div>
        <div class="activity-time">${Utils.formatRelative(a.created_at || a.createdAt)}</div>
      </div>
    </div>
  `).join('') || '<p style="color:var(--text-muted);padding:16px;">Nenhuma atividade registrada.</p>';
}

async function renderTopVehicles(stats) {
  const container = document.getElementById('top-vehicles');
  if (!container) return;
        <div class="activity-time">${Utils.formatCurrency(v.salePrice)} • ${Utils.formatKm(v.km)}</div>
      </div>
      ${Utils.getStatusBadge(v.status)}
    </div>
  `).join('') || '<p style="color:var(--text-muted);padding:16px;">Nenhum veículo no estoque.</p>';
}


/* ══════════════════════════════════════════════════════════════ */
/* ESTOQUE PAGE                                                    */
/* ══════════════════════════════════════════════════════════════ */
async function initEstoque() {
  let viewMode = 'grid';
  let filterStatus = 'all';
  let searchQuery = '';
  let editingId = null;

  await renderVehicles();
  updateStockCounts();

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
    searchInput.addEventListener('input', Utils.debounce(async () => {
      searchQuery = searchInput.value;
      await renderVehicles();
    }));
  }

  // Add button
  document.getElementById('btn-add-vehicle')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('modal-vehicle-title').textContent = 'Cadastrar Veículo';
    document.getElementById('form-vehicle').reset();
    document.getElementById('photo-preview').innerHTML = '';
    Modal.open('modal-vehicle');
  });

  // Photo upload
  const photoInput = document.getElementById('v-photos');
  if (photoInput) {
    photoInput.addEventListener('change', async () => {
      const preview = document.getElementById('photo-preview');
      preview.innerHTML = '';
      for (const file of photoInput.files) {
        const base64 = await fileToBase64(file);
        const img = document.createElement('img');
        img.src = base64;
        img.style.cssText = 'width:80px;height:60px;object-fit:cover;border-radius:6px;border:2px solid var(--border-color);';
        preview.appendChild(img);
      }
    });
  }

  // Save vehicle
  document.getElementById('btn-save-vehicle')?.addEventListener('click', async () => {
    const brand = document.getElementById('v-brand')?.value?.trim();
    const model = document.getElementById('v-model')?.value?.trim();
    if (!brand || !model) {
      Toast.error('Campos obrigatórios', 'Preencha marca e modelo.');
      return;
    }

    const photos = [];
    const photoInput = document.getElementById('v-photos');
    if (photoInput && photoInput.files.length > 0) {
      for (const file of photoInput.files) {
        photos.push(await fileToBase64(file));
      }
    }

    // If editing, preserve existing photos if no new ones
    let finalPhotos = photos;
    if (editingId && photos.length === 0) {
      const existing = await SiscarDB.getVehicle(editingId);
      finalPhotos = existing?.photos || [];
    }

    const data = {
      brand, model,
      year:          parseInt(document.getElementById('v-year')?.value) || new Date().getFullYear(),
      color:         document.getElementById('v-color')?.value || '',
      plate:         document.getElementById('v-plate')?.value?.toUpperCase() || '',
      km:            parseInt(document.getElementById('v-km')?.value) || 0,
      purchasePrice: parseFloat(document.getElementById('v-purchase')?.value) || 0,
      salePrice:     parseFloat(document.getElementById('v-sale')?.value) || 0,
      status:        document.getElementById('v-status')?.value || 'disponivel',
      category:      document.getElementById('v-category')?.value || 'Sedan',
      fuel:          document.getElementById('v-fuel')?.value || 'Flex',
      notes:         document.getElementById('v-notes')?.value || '',
      photos:        finalPhotos,
      docs:          []
    };

    if (editingId) {
      await SiscarDB.updateVehicle(editingId, data);
      Toast.success('Veículo atualizado!', `${brand} ${model} salvo com sucesso.`);
    } else {
      await SiscarDB.addVehicle(data);
      Toast.success('Veículo cadastrado!', `${brand} ${model} adicionado ao estoque.`);
    }

    Modal.close('modal-vehicle');
    document.getElementById('form-vehicle').reset();
    document.getElementById('photo-preview').innerHTML = '';
    editingId = null;
    await renderVehicles();
    await updateStockCounts();
  });

  async function updateStockCounts() {
    const vehicles = await SiscarDB.getVehicles();
    const counts = { disponivel: 0, reservado: 0, vendido: 0 };
    vehicles.forEach(v => counts[v.status] = (counts[v.status] || 0) + 1);
    const totalEl = document.getElementById('stock-total');
    const dispEl = document.getElementById('stock-disponivel');
    const resEl = document.getElementById('stock-reservado');
    const vendEl = document.getElementById('stock-vendido');
    if (totalEl) totalEl.textContent = vehicles.length;
    if (dispEl) dispEl.textContent = counts.disponivel;
    if (resEl) resEl.textContent = counts.reservado;
    if (vendEl) vendEl.textContent = counts.vendido;
  }

  async function renderVehicles() {
    const list = await SiscarDB.getVehicles({ status: filterStatus, search: searchQuery });
    const container = document.getElementById('vehicles-container');
    if (!container) return;

    if (!list.length) {
      container.className = '';
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
        <div class="vehicle-card">
          <div class="vehicle-img">
            ${v.photos && v.photos.length > 0
              ? `<img src="${v.photos[0]}" alt="${v.brand} ${v.model}" style="width:100%;height:100%;object-fit:cover;">`
              : `<span style="font-size:3rem;">${Utils.getCategoryIcon(v.category)}</span>`
            }
            <div class="vehicle-status">${Utils.getStatusBadge(v.status)}</div>
          </div>
          <div class="vehicle-body">
            <div class="vehicle-name">${Utils.safe(v.brand)} ${Utils.safe(v.model)} ${v.year}</div>
            <div class="vehicle-meta">
              <span>🎨 ${Utils.safe(v.color)}</span>
              <span>📍 ${Utils.safe(v.plate)}</span>
              <span>⛽ ${Utils.safe(v.fuel)}</span>
            </div>
            <div class="vehicle-meta"><span>🔢 ${Utils.formatKm(v.km)}</span></div>
            <div class="vehicle-price">${Utils.formatCurrency(v.salePrice)}</div>
            <div style="font-size:0.78rem;color:var(--success);margin-bottom:8px;">
              Margem: +${Utils.formatCurrency(v.salePrice - v.purchasePrice)}
            </div>
            <div class="vehicle-actions">
              <button class="btn btn-primary btn-sm" style="flex:1;" onclick="openVehicleDetail(${v.id})">👁 Detalhes</button>
              <button class="btn btn-secondary btn-icon" onclick="editVehicle(${v.id})" title="Editar">✏️</button>
              <button class="btn btn-secondary btn-icon" onclick="deleteVehicleConfirm(${v.id})" title="Remover">🗑️</button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.className = '';
      container.innerHTML = `
        <div class="table-wrapper">
          <table class="table">
            <thead><tr>
              <th>Veículo</th><th>Placa</th><th>Ano</th><th>KM</th><th>Compra</th><th>Venda</th><th>Margem</th><th>Status</th><th>Ações</th>
            </tr></thead>
            <tbody>
              ${list.map(v => `
                <tr>
                  <td><strong>${Utils.safe(v.brand)} ${Utils.safe(v.model)}</strong><br><small class="muted">${Utils.safe(v.color)} • ${Utils.safe(v.fuel)}</small></td>
                  <td>${Utils.safe(v.plate)}</td>
                  <td>${v.year}</td>
                  <td>${Utils.formatKm(v.km)}</td>
                  <td>${Utils.formatCurrency(v.purchasePrice)}</td>
                  <td><strong>${Utils.formatCurrency(v.salePrice)}</strong></td>
                  <td style="color:var(--success)">+${Utils.formatCurrency(v.salePrice - v.purchasePrice)}</td>
                  <td>${Utils.getStatusBadge(v.status)}</td>
                  <td>
                    <div style="display:flex;gap:6px;">
                      <button class="btn btn-primary btn-sm" onclick="openVehicleDetail(${v.id})">👁</button>
                      <button class="btn btn-secondary btn-sm" onclick="editVehicle(${v.id})">✏️</button>
                      <button class="btn btn-secondary btn-sm" onclick="deleteVehicleConfirm(${v.id})">🗑️</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>`;
    }
  }

  window.openVehicleDetail = async (id) => {
    const v = await SiscarDB.getVehicle(id);
    if (!v) return;
    const detailEl = document.getElementById('vehicle-detail-content');
    if (detailEl) {
      detailEl.innerHTML = `
        <div class="vehicle-detail-header">
          <div class="vehicle-gallery">
            ${v.photos && v.photos.length > 0
              ? v.photos.map(p => `<img src="${p}" alt="foto" style="width:100%;max-height:220px;object-fit:cover;border-radius:12px;margin-bottom:8px;">`).join('')
              : `<div style="height:180px;display:flex;align-items:center;justify-content:center;font-size:4rem;background:var(--card-bg-2);border-radius:12px;">${Utils.getCategoryIcon(v.category)}</div>`
            }
          </div>
          <div class="vehicle-detail-info">
            <h2>${Utils.safe(v.brand)} ${Utils.safe(v.model)} ${v.year}</h2>
            <div style="margin:8px 0;">${Utils.getStatusBadge(v.status)}</div>
            <div style="font-size:1.8rem;font-weight:900;color:var(--primary);margin:12px 0;">${Utils.formatCurrency(v.salePrice)}</div>
            <div style="color:var(--success);margin-bottom:16px;">Margem: +${Utils.formatCurrency(v.salePrice - v.purchasePrice)}</div>
            <div class="detail-grid">
              <div><span class="muted">Placa</span><strong>${Utils.safe(v.plate)}</strong></div>
              <div><span class="muted">Cor</span><strong>${Utils.safe(v.color)}</strong></div>
              <div><span class="muted">Combustível</span><strong>${Utils.safe(v.fuel)}</strong></div>
              <div><span class="muted">KM</span><strong>${Utils.formatKm(v.km)}</strong></div>
              <div><span class="muted">Categoria</span><strong>${Utils.safe(v.category)}</strong></div>
              <div><span class="muted">Compra</span><strong>${Utils.formatCurrency(v.purchasePrice)}</strong></div>
            </div>
            ${v.notes ? `<div style="margin-top:12px;padding:12px;background:var(--card-bg-2);border-radius:8px;color:var(--text-secondary);font-size:0.9rem;">📝 ${Utils.safe(v.notes)}</div>` : ''}
          </div>
        </div>
      `;
      Modal.open('modal-vehicle-detail');
    } else {
      Toast.info(`${v.brand} ${v.model} ${v.year}`, `${Utils.formatCurrency(v.salePrice)} • ${Utils.formatKm(v.km)}`);
    }
  };

  window.editVehicle = async (id) => {
    const v = await SiscarDB.getVehicle(id);
    if (!v) return;
    editingId = id;
    document.getElementById('modal-vehicle-title').textContent = 'Editar Veículo';
    const fields = { 'v-brand': v.brand, 'v-model': v.model, 'v-year': v.year, 'v-color': v.color, 'v-plate': v.plate, 'v-km': v.km, 'v-purchase': v.purchasePrice, 'v-sale': v.salePrice, 'v-status': v.status, 'v-category': v.category, 'v-fuel': v.fuel, 'v-notes': v.notes };
    for (const [id, val] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (el) el.value = val || '';
    }
    // Show existing photos
    const preview = document.getElementById('photo-preview');
    if (preview && v.photos && v.photos.length > 0) {
      preview.innerHTML = v.photos.map(p => `<img src="${p}" style="width:80px;height:60px;object-fit:cover;border-radius:6px;border:2px solid var(--border-color);">`).join('');
    }
    Modal.open('modal-vehicle');
  };

  window.deleteVehicleConfirm = (id) => {
    SiscarConfirm('Deseja remover este veículo do estoque?', async () => {
      await SiscarDB.deleteVehicle(id);
      await renderVehicles();
      await updateStockCounts();
      Toast.success('Removido!', 'Veículo removido do estoque.');
    });
  };
}

function fileToBase64(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
}


/* ══════════════════════════════════════════════════════════════ */
/* CLIENTES PAGE                                                   */
/* ══════════════════════════════════════════════════════════════ */
async function initClientes() {
  let searchQuery = '';
  let editingId = null;

  await renderClients();

  const search = document.getElementById('client-search');
  if (search) {
    search.addEventListener('input', Utils.debounce(async () => {
      searchQuery = search.value;
      await renderClients();
    }));
  }

  document.getElementById('btn-add-client')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('modal-client-title').textContent = 'Cadastrar Cliente';
    document.getElementById('form-client').reset();
    Modal.open('modal-client');
  });

  document.getElementById('btn-save-client')?.addEventListener('click', async () => {
    const name = document.getElementById('c-name')?.value?.trim();
    const phone = document.getElementById('c-phone')?.value?.trim();
    if (!name || !phone) {
      Toast.error('Campos obrigatórios', 'Nome e telefone são obrigatórios.');
      return;
    }
    const data = {
      name, phone,
      cpf:     document.getElementById('c-cpf')?.value || '',
      email:   document.getElementById('c-email')?.value || '',
      city:    document.getElementById('c-city')?.value || '',
      state:   document.getElementById('c-state')?.value || '',
      address: document.getElementById('c-address')?.value || '',
      notes:   document.getElementById('c-notes')?.value || '',
    };
    if (editingId) {
      await SiscarDB.updateClient(editingId, data);
      Toast.success('Cliente atualizado!', name);
    } else {
      await SiscarDB.addClient(data);
      Toast.success('Cliente cadastrado!', `${name} adicionado com sucesso.`);
    }
    Modal.close('modal-client');
    document.getElementById('form-client').reset();
    editingId = null;
    await renderClients();
  });

  async function renderClients() {
    const list = await SiscarDB.getClients({ search: searchQuery });
    const tbody = document.getElementById('clients-tbody');
    if (!tbody) return;

    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:40px;color:var(--text-muted);">👥 Nenhum cliente encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = await Promise.all(list.map(async c => {
      const sales = await SiscarDB.getClientSales(c.id);
      const totalSpent = sales.reduce((a, s) => a + s.salePrice, 0);
      const lastSale = sales.length ? sales.sort((a, b) => new Date(b.date) - new Date(a.date))[0] : null;
      const initials = Utils.getInitials(c.name);
      const color = Utils.getAvatarColor(c.name);
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar avatar-sm" style="background:${color};">${initials}</div>
              <div>
                <div style="font-weight:600;">${Utils.safe(c.name)}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">${c.cpf || 'CPF não informado'}</div>
              </div>
            </div>
          </td>
          <td>${Utils.safe(c.phone)}</td>
          <td>${c.email ? Utils.safe(c.email) : '-'}</td>
          <td>${c.city ? `${Utils.safe(c.city)}/${Utils.safe(c.state)}` : '-'}</td>
          <td><strong>${sales.length}</strong></td>
          <td><strong style="color:var(--success);">${Utils.formatCurrency(totalSpent)}</strong></td>
          <td>${lastSale ? Utils.formatDate(lastSale.date) : '-'}</td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-primary btn-sm" onclick="viewClientHistory(${c.id})">👁</button>
              <button class="btn btn-secondary btn-sm" onclick="editClient(${c.id})">✏️</button>
              <button class="btn btn-secondary btn-sm" onclick="deleteClientConfirm(${c.id})">🗑️</button>
            </div>
          </td>
        </tr>
      `;
    })).then(rows => rows.join(''));
  }

  window.editClient = async (id) => {
    const c = await SiscarDB.getClient(id);
    if (!c) return;
    editingId = id;
    document.getElementById('modal-client-title').textContent = 'Editar Cliente';
    const fields = { 'c-name': c.name, 'c-cpf': c.cpf, 'c-phone': c.phone, 'c-email': c.email, 'c-city': c.city, 'c-state': c.state, 'c-address': c.address, 'c-notes': c.notes };
    for (const [fid, val] of Object.entries(fields)) {
      const el = document.getElementById(fid);
      if (el) el.value = val || '';
    }
    Modal.open('modal-client');
  };

  window.viewClientHistory = async (id) => {
    const c = await SiscarDB.getClient(id);
    const sales = await SiscarDB.getClientSales(id);
    const histEl = document.getElementById('client-history-content');
    if (histEl) {
      const vehicles = await Promise.all(sales.map(s => SiscarDB.getVehicle(s.vehicleId)));
      histEl.innerHTML = `
        <h3 style="margin-bottom:8px;">${Utils.safe(c.name)}</h3>
        <p style="color:var(--text-muted);margin-bottom:16px;">${c.email || ''} • ${c.phone}</p>
        ${sales.length === 0 ? '<p style="color:var(--text-muted);">Nenhuma compra registrada.</p>' :
          sales.map((s, i) => {
            const v = vehicles[i];
            return `<div style="padding:12px;background:var(--card-bg-2);border-radius:8px;margin-bottom:8px;">
              <div style="font-weight:600;">${v ? v.brand + ' ' + v.model + ' ' + v.year : 'Veículo #' + s.vehicleId}</div>
              <div style="font-size:0.85rem;color:var(--text-muted);">${Utils.formatDate(s.date)} • ${Utils.formatCurrency(s.salePrice)}</div>
              <div style="font-size:0.82rem;color:var(--text-secondary);">${s.paymentType === 'a_vista' ? 'À Vista' : s.paymentType === 'financiamento' ? 'Financiamento' : 'Troca'}</div>
            </div>`;
          }).join('')
        }
      `;
      Modal.open('modal-client-history');
    }
  };

  window.deleteClientConfirm = (id) => {
    SiscarConfirm('Deseja remover este cliente permanentemente?', async () => {
      await SiscarDB.deleteClient(id);
      await renderClients();
      Toast.success('Removido!', 'Cliente removido.');
    });
  };
}


/* ══════════════════════════════════════════════════════════════ */
/* VENDAS PAGE                                                     */
/* ══════════════════════════════════════════════════════════════ */
async function initVendas() {
  let filterStatus = 'all';
  await renderSalesPage();
  await populateSaleSelects();

  document.getElementById('btn-add-sale')?.addEventListener('click', async () => {
    await populateSaleSelects();
    document.getElementById('form-sale').reset();
    Modal.open('modal-sale');
  });

  document.getElementById('s-payment')?.addEventListener('change', function () {
    const financingSection = document.getElementById('financing-section');
    if (financingSection) {
      financingSection.style.display = this.value === 'financiamento' ? 'block' : 'none';
    }
  });

  document.getElementById('s-vehicle')?.addEventListener('change', async function () {
    const v = await SiscarDB.getVehicle(parseInt(this.value));
    if (v) {
      const priceEl = document.getElementById('s-price');
      if (priceEl && !priceEl.value) priceEl.value = v.salePrice;
    }
  });

  document.getElementById('btn-save-sale')?.addEventListener('click', async () => {
    const vehicleId = parseInt(document.getElementById('s-vehicle')?.value);
    const clientId = parseInt(document.getElementById('s-client')?.value);
    const price = parseFloat(document.getElementById('s-price')?.value);
    const session = Auth.getSession();

    if (!vehicleId || !clientId || !price) {
      Toast.error('Campos obrigatórios', 'Selecione veículo, cliente e preço.');
      return;
    }

    const data = {
      vehicleId, clientId,
      date: document.getElementById('s-date')?.value || new Date().toISOString().split('T')[0],
      salePrice: price,
      paymentType: document.getElementById('s-payment')?.value || 'a_vista',
      financingBank: document.getElementById('s-bank')?.value || '',
      downPayment: parseFloat(document.getElementById('s-down')?.value) || 0,
      installments: parseInt(document.getElementById('s-installments')?.value) || 0,
      seller: session ? session.name : 'Sistema',
      sellerId: session ? session.id : 1,
      commission: Math.round(price * 0.03),
      status: 'concluida'
    };

    await SiscarDB.addSale(data);
    Modal.close('modal-sale');
    await renderSalesPage();
    await populateSaleSelects();
    Toast.success('Venda registrada!', Utils.formatCurrency(price));
  });

  document.querySelectorAll('.sales-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sales-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterStatus = btn.dataset.status;
      renderSalesPage();
    });
  });

  async function populateSaleSelects() {
    const vehicles = await SiscarDB.getVehicles({ status: 'disponivel' });
    const clients = await SiscarDB.getClients();
    const vSel = document.getElementById('s-vehicle');
    const cSel = document.getElementById('s-client');
    if (vSel) {
      vSel.innerHTML = '<option value="">Selecione um veículo...</option>' +
        vehicles.map(v => `<option value="${v.id}">${v.brand} ${v.model} ${v.year} — ${v.plate} (${Utils.formatCurrency(v.salePrice)})</option>`).join('');
    }
    if (cSel) {
      cSel.innerHTML = '<option value="">Selecione um cliente...</option>' +
        clients.map(c => `<option value="${c.id}">${c.name} — ${c.cpf || c.phone}</option>`).join('');
    }
  }

  async function renderSalesPage() {
    const sales = await SiscarDB.getSales(filterStatus !== 'all' ? { status: filterStatus } : {});
    const tbody = document.getElementById('sales-tbody');
    if (!tbody) return;

    if (!sales.length) {
      tbody.innerHTML = `<tr><td colspan="10" class="text-center" style="padding:40px;color:var(--text-muted);">💰 Nenhuma venda registrada.</td></tr>`;
      return;
    }

    tbody.innerHTML = await Promise.all(sales.map(async s => {
      const v = await SiscarDB.getVehicle(s.vehicleId);
      const c = await SiscarDB.getClient(s.clientId);
      return `
        <tr>
          <td><strong>#${String(s.id).padStart(4,'0')}</strong></td>
          <td>${v ? `${v.brand} ${v.model} ${v.year}` : '-'}<br><small class="muted">${v ? v.plate : ''}</small></td>
          <td>${c ? Utils.safe(c.name) : '-'}</td>
          <td>${Utils.formatDate(s.date)}</td>
          <td><strong>${Utils.formatCurrency(s.salePrice)}</strong></td>
          <td>${s.paymentType === 'a_vista' ? 'À Vista' : s.paymentType === 'financiamento' ? 'Financiamento' : 'Troca'}</td>
          <td>${Utils.safe(s.seller)}</td>
          <td style="color:var(--success)">${Utils.formatCurrency(s.commission)}</td>
          <td>${Utils.getStatusBadge(s.status)}</td>
          <td>
            <div style="display:flex;gap:4px;">
              <button class="btn btn-primary btn-sm" onclick="generateContractFromSale(${s.id})">📄</button>
              ${s.status === 'concluida' ? `<button class="btn btn-secondary btn-sm" onclick="cancelSaleConfirm(${s.id})">❌</button>` : ''}
            </div>
          </td>
        </tr>`;
    })).then(rows => rows.join(''));
  }

  window.cancelSaleConfirm = (id) => {
    SiscarConfirm('Deseja cancelar esta venda? O veículo voltará ao estoque.', async () => {
      await SiscarDB.cancelSale(id);
      await renderSalesPage();
      await populateSaleSelects();
      Toast.warning('Venda cancelada', 'O veículo foi devolvido ao estoque.');
    });
  };

  window.generateContractFromSale = (saleId) => {
    window.location.href = `contratos.html?sale=${saleId}`;
  };
}


/* ══════════════════════════════════════════════════════════════ */
/* FINANCEIRO PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
async function initFinanceiro() {
  let filterType = 'all';
  let filterCategory = '';
  let dateFrom = '';
  let dateTo = '';

  await renderFinancials();
  await renderCashflowChart();

  document.getElementById('btn-add-financial')?.addEventListener('click', () => {
    document.getElementById('form-financial').reset();
    Modal.open('modal-financial');
  });

  document.getElementById('btn-save-financial')?.addEventListener('click', async () => {
    const type = document.getElementById('f-type')?.value;
    const desc = document.getElementById('f-desc')?.value?.trim();
    const amount = parseFloat(document.getElementById('f-amount')?.value);
    if (!type || !desc || !amount) { Toast.error('Preencha todos os campos', ''); return; }

    await SiscarDB.addFinancial({
      type, description: desc,
      category: document.getElementById('f-category')?.value || 'Outros',
      amount,
      date: document.getElementById('f-date')?.value || new Date().toISOString().split('T')[0],
      status: type === 'receita' ? 'recebido' : 'pago',
      saleId: null
    });
    Modal.close('modal-financial');
    document.getElementById('form-financial').reset();
    await renderFinancials();
    Toast.success('Lançamento adicionado!', Utils.formatCurrency(amount));
  });

  // Filtros
  document.querySelectorAll('.fin-filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.fin-filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      filterType = btn.dataset.type;
      renderFinancials();
    });
  });

  document.getElementById('fin-date-from')?.addEventListener('change', e => { dateFrom = e.target.value; renderFinancials(); });
  document.getElementById('fin-date-to')?.addEventListener('change', e => { dateTo = e.target.value; renderFinancials(); });

  async function renderFinancials() {
    const filter = {};
    if (filterType !== 'all') filter.type = filterType;
    if (dateFrom) filter.dateFrom = dateFrom;
    if (dateTo) filter.dateTo = dateTo;

    const items = await SiscarDB.getFinancials(filter);
    const summary = await SiscarDB.getFinancialSummary(filter);

    const recEl = document.getElementById('fin-receita');
    const desEl = document.getElementById('fin-despesa');
    const salEl = document.getElementById('fin-saldo');
    if (recEl) recEl.textContent = Utils.formatCurrency(summary.receitas);
    if (desEl) desEl.textContent = Utils.formatCurrency(summary.despesas);
    if (salEl) {
      salEl.textContent = Utils.formatCurrency(summary.saldo);
      salEl.style.color = summary.saldo >= 0 ? 'var(--success)' : 'var(--danger)';
    }

    const tbody = document.getElementById('financials-tbody');
    if (!tbody) return;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:40px;color:var(--text-muted);">📈 Nenhum lançamento encontrado.</td></tr>`;
      return;
    }

    tbody.innerHTML = items.map(f => `
      <tr>
        <td>${Utils.formatDate(f.date)}</td>
        <td><span class="badge ${f.type === 'receita' ? 'badge-success' : 'badge-danger'}">${f.type === 'receita' ? '↑ Receita' : '↓ Despesa'}</span></td>
        <td>${Utils.safe(f.category)}</td>
        <td>${Utils.safe(f.description)}</td>
        <td style="color:${f.type === 'receita' ? 'var(--success)' : 'var(--danger)'};font-weight:700;">
          ${f.type === 'receita' ? '+' : '-'}${Utils.formatCurrency(f.amount)}
        </td>
        <td>${Utils.getStatusBadge(f.status)}</td>
        <td>
          ${!f.saleId ? `<button class="btn btn-secondary btn-sm" onclick="deleteFinancialConfirm(${f.id})">🗑️</button>` : '<span style="color:var(--text-muted);font-size:0.75rem;">Auto</span>'}
        </td>
      </tr>
    `).join('');
  }

  async function renderCashflowChart() {
    const canvas = document.getElementById('cashflow-chart');
    if (!canvas || !window.Chart) return;
    const items = await SiscarDB.getFinancials();
    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const recByMonth = new Array(12).fill(0);
    const dessByMonth = new Array(12).fill(0);
    items.forEach(f => {
      if (!f.date) return;
      const m = parseInt(f.date.split('-')[1]) - 1;
      if (f.type === 'receita') recByMonth[m] += f.amount;
      else dessByMonth[m] += f.amount;
    });
    const currentMonth = new Date().getMonth() + 1;
    const labels = months.slice(0, currentMonth);
    if (canvas._chart) canvas._chart.destroy();
    canvas._chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Receitas', data: recByMonth.slice(0, currentMonth), borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.1)', fill: true, tension: 0.4 },
          { label: 'Despesas', data: dessByMonth.slice(0, currentMonth), borderColor: '#FF4D4D', backgroundColor: 'rgba(255,77,77,0.1)', fill: true, tension: 0.4 }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'Poppins', size: 12 } } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } },
          y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B', callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k' } }
        }
      }
    });
  }

  window.deleteFinancialConfirm = (id) => {
    SiscarConfirm('Deseja remover este lançamento financeiro?', async () => {
      await SiscarDB.deleteFinancial(id);
      await renderFinancials();
      Toast.success('Removido!', '');
    });
  };

  // Export CSV
  document.getElementById('btn-export-fin')?.addEventListener('click', async () => {
    const items = await SiscarDB.getFinancials();
    Utils.exportCSV(
      ['Data', 'Tipo', 'Categoria', 'Descrição', 'Valor', 'Status'],
      items.map(f => [f.date, f.type, f.category, f.description, f.amount.toFixed(2), f.status]),
      'financeiro-siscar.csv'
    );
    Toast.success('Exportado!', 'Relatório CSV baixado.');
  });
}


/* ══════════════════════════════════════════════════════════════ */
/* CONTRATOS PAGE                                                  */
/* ══════════════════════════════════════════════════════════════ */
async function initContratos() {
  await populateContractSelects();

  // Check if coming from sales page
  const params = new URLSearchParams(window.location.search);
  const saleParam = params.get('sale');
  if (saleParam) {
    const sel = document.getElementById('contract-sale');
    if (sel) { sel.value = saleParam; generateContract(); }
  }

  document.getElementById('btn-generate-contract')?.addEventListener('click', generateContract);

  document.getElementById('btn-print-contract')?.addEventListener('click', () => {
    window.print();
    Toast.success('Imprimindo...', 'Verifique a impressora.');
  });

  document.getElementById('btn-save-contract')?.addEventListener('click', async () => {
    const saleId = parseInt(document.getElementById('contract-sale')?.value);
    const content = document.getElementById('contract-preview')?.innerHTML;
    if (!saleId || !content) { Toast.error('Gere o contrato primeiro', ''); return; }
    const existing = await SiscarDB.getContractBySale(saleId);
    if (existing) {
      Toast.info('Contrato já salvo', 'Este contrato já foi salvo anteriormente.');
      return;
    }
    await SiscarDB.addContract({ saleId, content });
    Toast.success('Contrato salvo!', 'Arquivo salvo no sistema.');
  });

  async function populateContractSelects() {
    const sales = await SiscarDB.getSales();
    const sel = document.getElementById('contract-sale');
    if (sel) {
      sel.innerHTML = '<option value="">Selecione uma venda...</option>' +
        await Promise.all(sales.map(async s => {
          const v = await SiscarDB.getVehicle(s.vehicleId);
          const c = await SiscarDB.getClient(s.clientId);
          return `<option value="${s.id}">#${String(s.id).padStart(4,'0')} — ${v ? v.brand + ' ' + v.model : '?'} | ${c ? c.name : '?'}</option>`;
        })).then(opts => opts.join(''));
    }
  }

  async function generateContract() {
    const saleId = parseInt(document.getElementById('contract-sale')?.value);
    if (!saleId) { Toast.error('Selecione uma venda', ''); return; }
    const sale = await SiscarDB.getSale(saleId);
    const vehicle = await SiscarDB.getVehicle(sale?.vehicleId);
    const client = await SiscarDB.getClient(sale?.clientId);
    const config = await SiscarDB.getConfig();
    if (!sale || !vehicle || !client) { Toast.error('Dados inválidos', 'Venda, veículo ou cliente não encontrados.'); return; }

    const paymentText = sale.paymentType === 'a_vista'
      ? `À Vista — ${Utils.formatCurrency(sale.salePrice)}`
      : `Financiamento — Entrada: ${Utils.formatCurrency(sale.downPayment)} + ${sale.installments}x parcelas${sale.financingBank ? ' via ' + sale.financingBank : ''}`;

    const preview = document.getElementById('contract-preview');
    if (!preview) return;
    preview.innerHTML = `
      <div class="contract-preview">
        <div style="text-align:center;margin-bottom:24px;">
          <h1 style="font-size:1.3rem;">CONTRATO DE COMPRA E VENDA DE VEÍCULO</h1>
          <p style="color:#666;font-size:0.85rem;">Contrato Nº: ${String(saleId).padStart(6,'0')} • Data: ${Utils.formatDate(sale.date)}</p>
        </div>
        <div class="contract-section">
          <h3>1. VENDEDOR (PARTE A)</h3>
          <p><strong>${config.name || 'Siscar Veículos'}</strong><br>
          CNPJ: ${config.cnpj || ''}<br>
          Endereço: ${config.address || ''}<br>
          Telefone: ${config.phone || ''} | WhatsApp: ${config.whatsapp || ''}<br>
          E-mail: ${config.email || ''}</p>
        </div>
        <div class="contract-section">
          <h3>2. COMPRADOR (PARTE B)</h3>
          <p><strong>${client.name}</strong><br>
          CPF: ${client.cpf || 'Não informado'}<br>
          Telefone: ${client.phone}<br>
          ${client.email ? 'E-mail: ' + client.email + '<br>' : ''}
          ${client.address ? 'Endereço: ' + client.address + (client.city ? ', ' + client.city + '/' + client.state : '') : ''}</p>
        </div>
        <div class="contract-section">
          <h3>3. VEÍCULO OBJETO DO CONTRATO</h3>
          <p><strong>${vehicle.brand} ${vehicle.model} ${vehicle.year}</strong><br>
          Placa: ${vehicle.plate} | Cor: ${vehicle.color}<br>
          Combustível: ${vehicle.fuel} | Quilometragem: ${Utils.formatKm(vehicle.km)}<br>
          Categoria: ${vehicle.category}</p>
        </div>
        <div class="contract-section">
          <h3>4. CONDIÇÕES DE PAGAMENTO</h3>
          <p>Valor Total: <strong>${Utils.formatCurrency(sale.salePrice)}</strong><br>
          Forma de Pagamento: ${paymentText}</p>
        </div>
        <div class="contract-section">
          <h3>5. DECLARAÇÕES DAS PARTES</h3>
          <p>A Parte A (Vendedor) declara que o veículo descrito está em boas condições gerais e livre de quaisquer ônus, débitos, multas pendentes de comunicação, alienações ou gravames que possam impedir a transferência de propriedade.</p>
          <p>A Parte B (Comprador) declara que inspecionou o veículo, que está ciente de seu estado de conservação e que concorda plenamente com os termos e condições estabelecidos neste contrato.</p>
        </div>
        <div class="contract-section">
          <h3>6. DISPOSIÇÕES GERAIS</h3>
          <p>Fica eleito o foro da comarca de ${config.city || 'São Paulo'} para dirimir quaisquer questões relativas ao presente instrumento. Declaram as partes que leram e estão de acordo com todas as cláusulas deste contrato, assinando em 2 (duas) vias de igual teor e forma.</p>
        </div>
        <p style="text-align:center;color:#666;margin:24px 0;">${config.city || 'São Paulo'}/${config.state || 'SP'}, ${Utils.formatDate(sale.date)}</p>
        <div class="contract-signatures">
          <div class="signature-line">
            <p><strong>${config.name || 'Siscar Veículos'}</strong><br>Vendedor (Parte A)</p>
          </div>
          <div class="signature-line">
            <p><strong>${client.name}</strong><br>Comprador (Parte B)</p>
          </div>
        </div>
      </div>
    `;
    Toast.success('Contrato gerado!', 'Pronto para impressão ou download.');
  }
}


/* ══════════════════════════════════════════════════════════════ */
/* AVALIAÇÕES PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
async function initAvaliacoes() {
  let editingId = null;
  let searchQuery = '';
  await populateEvalClients();
  await renderEvaluations();

  document.getElementById('btn-add-evaluation')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('form-evaluation').reset();
    Modal.open('modal-evaluation');
  });

  document.getElementById('eval-search')?.addEventListener('input', Utils.debounce(async (e) => {
    searchQuery = e.target.value;
    await renderEvaluations();
  }));

  document.getElementById('btn-save-evaluation')?.addEventListener('click', async () => {
    const vehicle = document.getElementById('e-vehicle')?.value?.trim();
    const plate = document.getElementById('e-plate')?.value?.trim();
    const clientId = parseInt(document.getElementById('e-client')?.value);
    if (!vehicle || !clientId) { Toast.error('Campos obrigatórios', ''); return; }
    const session = Auth.getSession();
    const data = {
      vehicle, plate: plate || '',
      clientId,
      evaluatorId: session ? session.id : 1,
      date: document.getElementById('e-date')?.value || new Date().toISOString().split('T')[0],
      fipePrice: parseFloat(document.getElementById('e-fipe')?.value) || 0,
      offeredPrice: parseFloat(document.getElementById('e-offered')?.value) || 0,
      status: 'pendente',
      notes: document.getElementById('e-notes')?.value || ''
    };
    if (editingId) {
      await SiscarDB.updateEvaluation(editingId, data);
      Toast.success('Avaliação atualizada!', vehicle);
    } else {
      await SiscarDB.addEvaluation(data);
      Toast.success('Avaliação criada!', `${vehicle} aguardando aprovação.`);
    }
    Modal.close('modal-evaluation');
    editingId = null;
    await renderEvaluations();
  });

  async function populateEvalClients() {
    const clients = await SiscarDB.getClients();
    const sel = document.getElementById('e-client');
    if (sel) {
      sel.innerHTML = '<option value="">Selecione o cliente...</option>' +
        clients.map(c => `<option value="${c.id}">${c.name} — ${c.cpf || c.phone}</option>`).join('');
    }
  }

  async function renderEvaluations() {
    const evaluations = await SiscarDB.getEvaluations({ search: searchQuery });
    const tbody = document.getElementById('evaluations-tbody');
    if (!tbody) return;
    if (!evaluations.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="text-center" style="padding:40px;color:var(--text-muted);">⭐ Nenhuma avaliação encontrada.</td></tr>`;
      return;
    }
    const clients = await Promise.all(evaluations.map(e => SiscarDB.getClient(e.clientId)));
    tbody.innerHTML = evaluations.map((e, i) => {
      const c = clients[i];
      const discount = e.fipePrice > 0 ? Math.round((1 - e.offeredPrice / e.fipePrice) * 100) : 0;
      return `
        <tr>
          <td><strong>${Utils.safe(e.vehicle)}</strong><br><small class="muted">${Utils.safe(e.plate)}</small></td>
          <td>${c ? Utils.safe(c.name) : '-'}</td>
          <td>${Utils.formatDate(e.date)}</td>
          <td>${Utils.formatCurrency(e.fipePrice)}</td>
          <td><strong>${Utils.formatCurrency(e.offeredPrice)}</strong></td>
          <td style="color:${discount > 0 ? 'var(--success)' : 'var(--warning)'}">-${discount}% FIPE</td>
          <td>${Utils.getStatusBadge(e.status)}</td>
          <td style="max-width:150px;font-size:0.8rem;color:var(--text-muted);">${Utils.safe(e.notes || '-')}</td>
          <td>
            <div style="display:flex;gap:4px;">
              ${e.status === 'pendente' ? `
                <button class="btn btn-success btn-sm" onclick="approveEval(${e.id})">✅</button>
                <button class="btn btn-secondary btn-sm" onclick="rejectEval(${e.id})">❌</button>
              ` : '<span style="color:var(--text-muted);font-size:0.8rem;">Finalizada</span>'}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  window.approveEval = async (id) => {
    await SiscarDB.updateEvaluation(id, { status: 'aprovada' });
    await renderEvaluations();
    Toast.success('Avaliação aprovada!', '');
  };
  window.rejectEval = async (id) => {
    await SiscarDB.updateEvaluation(id, { status: 'recusada' });
    await renderEvaluations();
    Toast.warning('Avaliação recusada.', '');
  };
}


/* ══════════════════════════════════════════════════════════════ */
/* VISTORIA PAGE                                                   */
/* ══════════════════════════════════════════════════════════════ */
async function initVistoria() {
  await populateVistoriaVehicles();
  await renderVistorias();

  // Check options
  document.querySelectorAll('.check-option').forEach(btn => {
    btn.addEventListener('click', () => {
      const group = btn.closest('.check-options');
      group.querySelectorAll('.check-option').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  document.getElementById('btn-finish-vistoria')?.addEventListener('click', async () => {
    const vehicleId = parseInt(document.getElementById('vistoria-vehicle')?.value);
    const plate = document.getElementById('vistoria-plate')?.value?.trim();
    const observations = document.getElementById('vistoria-obs')?.value || '';
    if (!plate) { Toast.error('Informe a placa', ''); return; }

    const items = [];
    let ok = 0, att = 0, prob = 0;
    document.querySelectorAll('.vistoria-item').forEach(item => {
      const label = item.querySelector('.check-label')?.textContent || '';
      const active = item.querySelector('.check-option.active');
      if (active) {
        const status = active.classList.contains('ok') ? 'ok' : active.classList.contains('atention') ? 'atencao' : 'problema';
        items.push({ label, status });
        if (status === 'ok') ok++;
        else if (status === 'atencao') att++;
        else prob++;
      }
    });

    const generalStatus = prob > 3 ? 'problema' : att > 2 ? 'atencao' : 'ok';
    const session = Auth.getSession();
    await SiscarDB.addVistoria({
      vehicleId: vehicleId || null,
      vehicleName: document.getElementById('vistoria-vehicle')?.options[document.getElementById('vistoria-vehicle').selectedIndex]?.text || '',
      plate, items, generalStatus, notes: observations,
      date: new Date().toISOString().split('T')[0],
      inspectorId: session ? session.id : 1,
      summary: { ok, att, prob }
    });

    await renderVistorias();
    Toast.success('Vistoria finalizada!', `✅ ${ok} OK | ⚠️ ${att} Atenção | ❌ ${prob} Problemas`);

    // Reset form
    document.querySelectorAll('.check-option').forEach(b => b.classList.remove('active'));
    if (document.getElementById('vistoria-obs')) document.getElementById('vistoria-obs').value = '';
  });

  async function populateVistoriaVehicles() {
    const vehicles = await SiscarDB.getVehicles();
    const sel = document.getElementById('vistoria-vehicle');
    if (sel) {
      sel.innerHTML = '<option value="">Selecione (opcional)...</option>' +
        vehicles.map(v => `<option value="${v.id}">${v.brand} ${v.model} ${v.year} — ${v.plate}</option>`).join('');
    }
    sel?.addEventListener('change', async function() {
      const v = await SiscarDB.getVehicle(parseInt(this.value));
      const plateEl = document.getElementById('vistoria-plate');
      if (v && plateEl) plateEl.value = v.plate;
    });
  }

  async function renderVistorias() {
    const list = await SiscarDB.getVistorias();
    const tbody = document.getElementById('vistorias-tbody');
    if (!tbody) return;
    if (!list.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:40px;color:var(--text-muted);">🔍 Nenhuma vistoria realizada.</td></tr>`;
      return;
    }
    tbody.innerHTML = list.map(v => `
      <tr>
        <td>${Utils.formatDate(v.date)}</td>
        <td><strong>${Utils.safe(v.plate)}</strong><br><small class="muted">${Utils.safe(v.vehicleName || '')}</small></td>
        <td>✅ ${v.summary?.ok || 0} | ⚠️ ${v.summary?.att || 0} | ❌ ${v.summary?.prob || 0}</td>
        <td>${Utils.getStatusBadge(v.generalStatus || 'ok')}</td>
        <td style="max-width:150px;font-size:0.8rem;color:var(--text-muted);">${Utils.safe(v.notes || '-')}</td>
        <td><button class="btn btn-primary btn-sm" onclick="printVistoriaReport(${v.id})">🖨️</button></td>
      </tr>
    `).join('');
  }

  window.printVistoriaReport = async (id) => {
    const v = await SiscarDB.db.vistorias.get(id);
    if (!v) return;
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Vistoria — ${v.plate}</title><style>
        body{font-family:Arial;padding:20px;color:#333;}h1{color:#E22446;}
        table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ddd;padding:8px;}
        .ok{color:green;}.atencao{color:orange;}.problema{color:red;}
      </style></head><body>
        <h1>Relatório de Vistoria</h1>
        <p><strong>Placa:</strong> ${v.plate} | <strong>Veículo:</strong> ${v.vehicleName || '-'} | <strong>Data:</strong> ${Utils.formatDate(v.date)}</p>
        <table><thead><tr><th>Item</th><th>Status</th></tr></thead><tbody>
          ${(v.items || []).map(item => `<tr><td>${item.label}</td><td class="${item.status}">${item.status === 'ok' ? '✅ OK' : item.status === 'atencao' ? '⚠️ Atenção' : '❌ Problema'}</td></tr>`).join('')}
        </tbody></table>
        <p style="margin-top:16px;"><strong>Observações:</strong> ${v.notes || '-'}</p>
        <p><strong>Resultado Geral:</strong> ${v.summary?.ok || 0} OK, ${v.summary?.att || 0} Atenção, ${v.summary?.prob || 0} Problemas</p>
        <script>window.print();</script>
      </body></html>
    `);
  };
}


/* ══════════════════════════════════════════════════════════════ */
/* INTEGRADOR PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
async function initIntegrador() {
  await renderPortals();

  document.getElementById('btn-publish-all')?.addEventListener('click', async () => {
    const portals = await SiscarDB.getPortals();
    const active = portals.filter(p => p.active);
    if (!active.length) { Toast.warning('Nenhum portal ativo', 'Ative ao menos um portal primeiro.'); return; }
    Toast.success('Publicação iniciada!', `Enviando para ${active.length} portais...`);
    await SiscarDB.logActivity(`Publicação em massa: ${active.length} portais`, 'portal');
  });

  async function renderPortals() {
    const portals = await SiscarDB.getPortals();
    const container = document.getElementById('portals-container');
    if (!container) return;

    const totalViews = portals.filter(p => p.active).reduce((a, p) => a + p.views, 0);
    const totalListings = portals.filter(p => p.active).reduce((a, p) => a + p.listings, 0);

    const viewsEl = document.getElementById('portal-total-views');
    const listingsEl = document.getElementById('portal-total-listings');
    if (viewsEl) viewsEl.textContent = Utils.formatNumber(totalViews);
    if (listingsEl) listingsEl.textContent = totalListings;

    container.innerHTML = portals.map(p => `
      <div class="portal-admin-card ${p.active ? 'active' : ''}">
        <div class="portal-admin-logo" style="color:${p.color || '#666'}">${p.icon}</div>
        <div class="portal-admin-name">${Utils.safe(p.name)}</div>
        <div class="portal-admin-stats">
          ${p.active ? `${p.listings} anúncios • ${Utils.formatNumber(p.views)} views` : 'Inativo'}
        </div>
        <label class="toggle" onclick="togglePortalBtn(${p.id})">
          <div class="toggle-track ${p.active ? 'on' : ''}">
            <div class="toggle-thumb"></div>
          </div>
          <span class="toggle-label">${p.active ? 'Ativo' : 'Inativo'}</span>
        </label>
      </div>
    `).join('');
  }

  window.togglePortalBtn = async (id) => {
    const updated = await SiscarDB.togglePortal(id);
    await renderPortals();
    Toast.info(updated.name, updated.active ? 'Integração ativada!' : 'Integração desativada.');
  };
}


/* ══════════════════════════════════════════════════════════════ */
/* RELATÓRIOS PAGE                                                 */
/* ══════════════════════════════════════════════════════════════ */
async function initRelatorios() {
  const stats = await SiscarDB.getDashboardStats();
  renderReportKPIs(stats);
  renderReportCharts(stats);

  document.getElementById('btn-export-report')?.addEventListener('click', async () => {
    const sales = await SiscarDB.getSales();
    const vehicles = await Promise.all(sales.map(s => SiscarDB.getVehicle(s.vehicleId)));
    const clients = await Promise.all(sales.map(s => SiscarDB.getClient(s.clientId)));
    Utils.exportCSV(
      ['#', 'Data', 'Veículo', 'Placa', 'Cliente', 'Valor', 'Forma', 'Vendedor', 'Comissão', 'Status'],
      sales.map((s, i) => [
        String(s.id).padStart(4,'0'), s.date,
        vehicles[i] ? `${vehicles[i].brand} ${vehicles[i].model}` : '-',
        vehicles[i] ? vehicles[i].plate : '-',
        clients[i] ? clients[i].name : '-',
        s.salePrice.toFixed(2),
        s.paymentType, s.seller,
        s.commission.toFixed(2), s.status
      ]),
      'relatorio-vendas-siscar.csv'
    );
    Toast.success('Exportado!', 'Relatório CSV baixado.');
  });

  function renderReportKPIs(stats) {
    const kpiEl = document.getElementById('report-kpis');
    if (!kpiEl) return;
    const ticketMedio = stats.salesCount > 0 ? stats.totalReceitas / stats.salesCount : 0;
    kpiEl.innerHTML = `
      <div class="kpi-card">
        <div class="kpi-header"><div class="kpi-icon" style="background:rgba(226,36,70,0.15);">💰</div></div>
        <div class="kpi-value">${Utils.formatCurrency(stats.totalReceitas)}</div>
        <div class="kpi-label">Receita Total</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><div class="kpi-icon" style="background:rgba(74,157,255,0.15);">🚗</div></div>
        <div class="kpi-value">${stats.salesCount}</div>
        <div class="kpi-label">Vendas Realizadas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><div class="kpi-icon" style="background:rgba(0,200,150,0.15);">📈</div></div>
        <div class="kpi-value">${Utils.formatCurrency(ticketMedio)}</div>
        <div class="kpi-label">Ticket Médio</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-header"><div class="kpi-icon" style="background:rgba(255,179,0,0.15);">⭐</div></div>
        <div class="kpi-value">${Utils.formatCurrency(stats.avgProfit)}</div>
        <div class="kpi-label">Lucro Médio/Veículo</div>
      </div>
    `;
  }

  function renderReportCharts(stats) {
    const c1 = document.getElementById('report-chart-1');
    const c2 = document.getElementById('report-chart-2');
    const c3 = document.getElementById('report-chart-3');
    const c4 = document.getElementById('report-chart-4');
    if (!window.Chart) return;

    const months = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];
    const salesByMonth = new Array(12).fill(0);
    const revByMonth = new Array(12).fill(0);
    stats.sales.forEach(s => {
      if (!s.date) return;
      const m = parseInt(s.date.split('-')[1]) - 1;
      salesByMonth[m]++;
      revByMonth[m] += s.salePrice;
    });
    const curM = new Date().getMonth() + 1;
    const labels = months.slice(0, curM);
    const chartOpts = {
      plugins: { legend: { labels: { color: '#94A3B8', font: { family: 'Poppins', size: 11 } } } },
      scales: { x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } }, y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#64748B' } } }
    };

    const cats = {};
    stats.vehicles.forEach(v => { if (v.status !== 'vendido') cats[v.category] = (cats[v.category] || 0) + 1; });

    const payTypes = { a_vista: 0, financiamento: 0, troca: 0 };
    stats.sales.forEach(s => { payTypes[s.paymentType] = (payTypes[s.paymentType] || 0) + 1; });

    if (c1) { if (c1._chart) c1._chart.destroy(); c1._chart = new Chart(c1, { type: 'bar', data: { labels, datasets: [{ label: 'Vendas', data: salesByMonth.slice(0, curM), backgroundColor: '#E22446', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, ...chartOpts } }); }
    if (c2) { if (c2._chart) c2._chart.destroy(); c2._chart = new Chart(c2, { type: 'line', data: { labels, datasets: [{ label: 'Receita (R$)', data: revByMonth.slice(0, curM), borderColor: '#00C896', backgroundColor: 'rgba(0,200,150,0.1)', fill: true, tension: 0.4 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: chartOpts.plugins, scales: { x: chartOpts.scales.x, y: { ...chartOpts.scales.y, ticks: { color: '#64748B', callback: v => 'R$ ' + (v/1000).toFixed(0) + 'k' } } } } }); }
    if (c3) { if (c3._chart) c3._chart.destroy(); c3._chart = new Chart(c3, { type: 'pie', data: { labels: ['À Vista', 'Financiamento', 'Troca'], datasets: [{ data: [payTypes.a_vista, payTypes.financiamento, payTypes.troca], backgroundColor: ['#00C896', '#4A9DFF', '#FFB300'], borderColor: 'transparent' }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { family: 'Poppins', size: 11 } } } } } }); }
    if (c4) { if (c4._chart) c4._chart.destroy(); c4._chart = new Chart(c4, { type: 'bar', data: { labels: Object.keys(cats), datasets: [{ label: 'Estoque', data: Object.values(cats), backgroundColor: '#4A9DFF', borderRadius: 6 }] }, options: { responsive: true, maintainAspectRatio: false, ...chartOpts } }); }
  }
}


/* ══════════════════════════════════════════════════════════════ */
/* CONFIGURAÇÕES PAGE                                              */
/* ══════════════════════════════════════════════════════════════ */
async function initConfiguracoes() {
  const config = await SiscarDB.getConfig();
  const fieldMap = { 'cfg-name': 'name', 'cfg-cnpj': 'cnpj', 'cfg-address': 'address', 'cfg-phone': 'phone', 'cfg-whatsapp': 'whatsapp', 'cfg-email': 'email', 'cfg-website': 'website', 'cfg-commission': 'commissionRate', 'cfg-city': 'city', 'cfg-state': 'state' };

  for (const [id, key] of Object.entries(fieldMap)) {
    const el = document.getElementById(id);
    if (el) el.value = config[key] || '';
  }

  // Logo preview
  if (config.logo) {
    const logoPreview = document.getElementById('logo-preview');
    if (logoPreview) { logoPreview.src = config.logo; logoPreview.style.display = 'block'; }
  }

  // Logo upload
  document.getElementById('cfg-logo')?.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const base64 = await fileToBase64(file);
    const logoPreview = document.getElementById('logo-preview');
    if (logoPreview) { logoPreview.src = base64; logoPreview.style.display = 'block'; }
    await SiscarDB.setConfig('logo', base64);
  });

  document.getElementById('btn-save-config')?.addEventListener('click', async () => {
    const obj = {};
    for (const [id, key] of Object.entries(fieldMap)) {
      const el = document.getElementById(id);
      if (el) obj[key] = el.value;
    }
    await SiscarDB.setConfigBulk(obj);
    Toast.success('Configurações salvas!', 'As alterações foram salvas com sucesso.');
    Dashboard.loadUserInfo();
  });

  // Reset DB button (dev)
  document.getElementById('btn-reset-db')?.addEventListener('click', () => {
    SiscarConfirm('⚠️ ATENÇÃO: Isso apagará TODOS os dados do sistema. Deseja continuar?', async () => {
      await SiscarDB.resetDB();
    });
  });
}


/* ══════════════════════════════════════════════════════════════ */
/* USUÁRIOS PAGE                                                   */
/* ══════════════════════════════════════════════════════════════ */
async function initUsuarios() {
  let editingId = null;
  await renderUsers();

  document.getElementById('btn-add-user')?.addEventListener('click', () => {
    editingId = null;
    document.getElementById('modal-user-title').textContent = 'Novo Usuário';
    document.getElementById('form-user').reset();
    const passEl = document.getElementById('u-password');
    if (passEl) { passEl.required = true; passEl.placeholder = 'Senha obrigatória'; }
    Modal.open('modal-user');
  });

  document.getElementById('btn-save-user')?.addEventListener('click', async () => {
    const name = document.getElementById('u-name')?.value?.trim();
    const email = document.getElementById('u-email')?.value?.trim()?.toLowerCase();
    const role = document.getElementById('u-role')?.value;
    const password = document.getElementById('u-password')?.value;
    if (!name || !email) { Toast.error('Campos obrigatórios', 'Nome e e-mail são obrigatórios.'); return; }
    if (!editingId && !password) { Toast.error('Senha obrigatória', 'Defina uma senha para o novo usuário.'); return; }

    const perms = {};
    document.querySelectorAll('.perm-check').forEach(cb => { perms[cb.dataset.perm] = cb.checked; });

    const data = {
      name, email, role: role || 'vendedor',
      phone: document.getElementById('u-phone')?.value || '',
      permissions: perms,
    };
    if (password) data.password = password;

    if (editingId) {
      await SiscarDB.updateUser(editingId, data);
      Toast.success('Usuário atualizado!', name);
    } else {
      // Check email unique
      const existing = await SiscarDB.getUserByEmail(email);
      if (existing) { Toast.error('E-mail já cadastrado', 'Use um e-mail diferente.'); return; }
      await SiscarDB.addUser(data);
      Toast.success('Usuário criado!', `${name} pode acessar o sistema.`);
    }
    Modal.close('modal-user');
    editingId = null;
    await renderUsers();
  });

  async function renderUsers() {
    const users = await SiscarDB.getUsers();
    const tbody = document.getElementById('users-tbody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => {
      const initials = Utils.getInitials(u.name);
      const color = Utils.getAvatarColor(u.name);
      return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px;">
              <div class="avatar avatar-sm" style="background:${color};">${initials}</div>
              <div>
                <div style="font-weight:600;">${Utils.safe(u.name)}</div>
                <div style="font-size:0.78rem;color:var(--text-muted);">${Utils.safe(u.email)}</div>
              </div>
            </div>
          </td>
          <td>${Utils.getRoleBadge(u.role)}</td>
          <td>${u.phone || '-'}</td>
          <td>${u.lastLogin ? Utils.safe(u.lastLogin) : 'Nunca'}</td>
          <td><span class="badge ${u.active ? 'badge-success' : 'badge-muted'}">${u.active ? 'Ativo' : 'Inativo'}</span></td>
          <td>
            <div style="display:flex;gap:6px;">
              <button class="btn btn-secondary btn-sm" onclick="editUser(${u.id})">✏️</button>
              <button class="btn btn-primary btn-sm" onclick="toggleUserBtn(${u.id})">${u.active ? '🔒 Desativar' : '🔓 Ativar'}</button>
              ${u.id !== 1 ? `<button class="btn btn-secondary btn-sm" onclick="deleteUserConfirm(${u.id})">🗑️</button>` : ''}
            </div>
          </td>
        </tr>
      `;
    }).join('');
  }

  const allPerms = ['estoque', 'clientes', 'vendas', 'financeiro', 'contratos', 'avaliacoes', 'vistoria', 'integrador', 'relatorios', 'configuracoes', 'usuarios'];

  window.editUser = async (id) => {
    const u = await SiscarDB.getUser(id);
    if (!u) return;
    editingId = id;
    document.getElementById('modal-user-title').textContent = 'Editar Usuário';
    const fields = { 'u-name': u.name, 'u-email': u.email, 'u-role': u.role, 'u-phone': u.phone };
    for (const [fid, val] of Object.entries(fields)) {
      const el = document.getElementById(fid);
      if (el) el.value = val || '';
    }
    const passEl = document.getElementById('u-password');
    if (passEl) { passEl.value = ''; passEl.required = false; passEl.placeholder = 'Deixe em branco para manter'; }
    // Permissions
    allPerms.forEach(perm => {
      const cb = document.querySelector(`.perm-check[data-perm="${perm}"]`);
      if (cb) cb.checked = u.permissions ? u.permissions[perm] : false;
    });
    Modal.open('modal-user');
  };

  window.toggleUserBtn = async (id) => {
    const u = await SiscarDB.toggleUser(id);
    await renderUsers();
    Toast.info(u.name, u.active ? 'Usuário ativado.' : 'Usuário desativado.');
  };

  window.deleteUserConfirm = (id) => {
    SiscarConfirm('Deseja remover este usuário permanentemente?', async () => {
      await SiscarDB.deleteUser(id);
      await renderUsers();
      Toast.success('Removido!', '');
    });
  };

  // Role change → auto permissions
  document.getElementById('u-role')?.addEventListener('change', function() {
    allPerms.forEach(perm => {
      const cb = document.querySelector(`.perm-check[data-perm="${perm}"]`);
      if (!cb) return;
      if (this.value === 'admin') cb.checked = true;
      else if (this.value === 'gerente') cb.checked = ['estoque','clientes','vendas','financeiro','contratos','avaliacoes','vistoria','integrador','relatorios'].includes(perm);
      else cb.checked = ['estoque','clientes','vendas','contratos','avaliacoes','vistoria'].includes(perm);
    });
  });
}
