/* ═══════════════════════════════════════════════════════════════
   SISCAR — APP.JS — Core utilities, mock data, routing
   ═══════════════════════════════════════════════════════════════ */

/* ── Mock Data ─────────────────────────────────────────────────── */
const SiscarData = {
  vehicles: [
    { id: 1, brand: 'Toyota', model: 'Corolla', year: 2022, color: 'Prata', plate: 'ABC-1234', km: 32000, purchasePrice: 85000, salePrice: 99900, status: 'disponivel', category: 'Sedan', fuel: 'Flex', docs: [], photos: [] },
    { id: 2, brand: 'Honda', model: 'Civic', year: 2021, color: 'Preto', plate: 'DEF-5678', km: 45000, purchasePrice: 88000, salePrice: 104900, status: 'disponivel', category: 'Sedan', fuel: 'Flex', docs: [], photos: [] },
    { id: 3, brand: 'Volkswagen', model: 'T-Cross', year: 2023, color: 'Branco', plate: 'GHI-9012', km: 12000, purchasePrice: 110000, salePrice: 129900, status: 'reservado', category: 'SUV', fuel: 'Flex', docs: [], photos: [] },
    { id: 4, brand: 'Jeep', model: 'Compass', year: 2022, color: 'Azul', plate: 'JKL-3456', km: 28000, purchasePrice: 140000, salePrice: 165000, status: 'disponivel', category: 'SUV', fuel: 'Diesel', docs: [], photos: [] },
    { id: 5, brand: 'Chevrolet', model: 'Onix', year: 2023, color: 'Vermelho', plate: 'MNO-7890', km: 8000, purchasePrice: 62000, salePrice: 74900, status: 'vendido', category: 'Hatch', fuel: 'Flex', docs: [], photos: [] },
    { id: 6, brand: 'Ford', model: 'EcoSport', year: 2021, color: 'Cinza', plate: 'PQR-1234', km: 56000, purchasePrice: 72000, salePrice: 86900, status: 'disponivel', category: 'SUV', fuel: 'Flex', docs: [], photos: [] },
    { id: 7, brand: 'Renault', model: 'Kwid', year: 2022, color: 'Laranja', plate: 'STU-5678', km: 22000, purchasePrice: 45000, salePrice: 57900, status: 'disponivel', category: 'Hatch', fuel: 'Flex', docs: [], photos: [] },
    { id: 8, brand: 'Hyundai', model: 'Creta', year: 2023, color: 'Branco', plate: 'VWX-9012', km: 5000, purchasePrice: 130000, salePrice: 152900, status: 'disponivel', category: 'SUV', fuel: 'Flex', docs: [], photos: [] },
  ],

  clients: [
    { id: 1, name: 'João Silva Santos', cpf: '123.456.789-00', phone: '(11) 98765-4321', email: 'joao.silva@email.com', city: 'São Paulo', state: 'SP', purchases: 2, lastPurchase: '2024-03-15', totalSpent: 185000 },
    { id: 2, name: 'Maria Fernanda Costa', cpf: '987.654.321-00', phone: '(21) 97654-3210', email: 'maria.costa@email.com', city: 'Rio de Janeiro', state: 'RJ', purchases: 1, lastPurchase: '2024-04-02', totalSpent: 99900 },
    { id: 3, name: 'Carlos Eduardo Lima', cpf: '456.789.123-00', phone: '(31) 96543-2109', email: 'carlos.lima@email.com', city: 'Belo Horizonte', state: 'MG', purchases: 3, lastPurchase: '2024-04-20', totalSpent: 342000 },
    { id: 4, name: 'Ana Paula Rodrigues', cpf: '789.123.456-00', phone: '(41) 95432-1098', email: 'ana.rodrigues@email.com', city: 'Curitiba', state: 'PR', purchases: 1, lastPurchase: '2024-05-01', totalSpent: 129900 },
    { id: 5, name: 'Roberto Alves Neto', cpf: '321.654.987-00', phone: '(51) 94321-0987', email: 'roberto.alves@email.com', city: 'Porto Alegre', state: 'RS', purchases: 2, lastPurchase: '2024-05-10', totalSpent: 220000 },
    { id: 6, name: 'Luciana Brito Mendes', cpf: '654.987.321-00', phone: '(85) 93210-9876', email: 'luciana.brito@email.com', city: 'Fortaleza', state: 'CE', purchases: 1, lastPurchase: '2024-05-18', totalSpent: 74900 },
  ],

  sales: [
    { id: 1, vehicleId: 5, clientId: 1, date: '2024-03-15', salePrice: 74900, paymentType: 'financiamento', financingBank: 'Banco do Brasil', downPayment: 15000, installments: 48, seller: 'Carlos Vendedor', commission: 2247, status: 'concluida' },
    { id: 2, vehicleId: 3, clientId: 2, date: '2024-04-02', salePrice: 99900, paymentType: 'a_vista', financingBank: '', downPayment: 0, installments: 0, seller: 'Maria Vendedora', commission: 2997, status: 'concluida' },
    { id: 3, vehicleId: 4, clientId: 3, date: '2024-04-20', salePrice: 165000, paymentType: 'financiamento', financingBank: 'Santander', downPayment: 30000, installments: 60, seller: 'Carlos Vendedor', commission: 4950, status: 'concluida' },
    { id: 4, vehicleId: 1, clientId: 4, date: '2024-05-01', salePrice: 129900, paymentType: 'troca', financingBank: '', downPayment: 40000, installments: 24, seller: 'João Gerente', commission: 3897, status: 'concluida' },
  ],

  financials: [
    { id: 1, type: 'receita', category: 'Venda de Veículo', description: 'Venda Honda Civic DEF-5678', amount: 99900, date: '2024-04-02', status: 'recebido' },
    { id: 2, type: 'receita', category: 'Venda de Veículo', description: 'Venda Jeep Compass JKL-3456', amount: 165000, date: '2024-04-20', status: 'recebido' },
    { id: 3, type: 'despesa', category: 'Manutenção', description: 'Revisão Toyota Corolla ABC-1234', amount: 1200, date: '2024-04-05', status: 'pago' },
    { id: 4, type: 'despesa', category: 'Aluguel', description: 'Aluguel do estabelecimento - Abril', amount: 4500, date: '2024-04-10', status: 'pago' },
    { id: 5, type: 'despesa', category: 'Funcionários', description: 'Folha de pagamento - Abril', amount: 18000, date: '2024-04-30', status: 'pago' },
    { id: 6, type: 'receita', category: 'Serviço', description: 'Avaliação de veículo - Cliente Roberto', amount: 350, date: '2024-05-05', status: 'recebido' },
    { id: 7, type: 'despesa', category: 'Marketing', description: 'Anúncios OLX e WebMotors - Maio', amount: 800, date: '2024-05-01', status: 'pago' },
  ],

  evaluations: [
    { id: 1, vehicle: 'Ford Ka 2019', plate: 'RST-5432', client: 'Ana Paula Rodrigues', evaluator: 'Carlos Vendedor', date: '2024-05-20', fipePrice: 35000, offeredPrice: 28000, status: 'aprovada', notes: 'Veículo em bom estado geral, pequenos amassados na porta traseira direita.' },
    { id: 2, vehicle: 'Chevrolet Prisma 2018', plate: 'UVW-8765', client: 'Roberto Alves Neto', evaluator: 'João Gerente', date: '2024-05-22', fipePrice: 42000, offeredPrice: 34000, status: 'pendente', notes: 'Aguardando análise de documentação.' },
    { id: 3, vehicle: 'Fiat Argo 2021', plate: 'XYZ-1098', client: 'Luciana Brito Mendes', evaluator: 'Maria Vendedora', date: '2024-05-25', fipePrice: 58000, offeredPrice: 47000, status: 'aprovada', notes: 'Ótimo estado, acima da tabela FIPE por conta de acessórios.' },
  ],

  portals: [
    { id: 1, name: 'OLX', icon: '🏷️', active: true, listings: 8, views: 1248, color: '#7B2D8B' },
    { id: 2, name: 'WebMotors', icon: '🚗', active: true, listings: 8, views: 2145, color: '#E8272F' },
    { id: 3, name: 'iCarros', icon: '🚙', active: true, listings: 6, views: 879, color: '#00A0DC' },
    { id: 4, name: 'SóCarrão', icon: '🚘', active: false, listings: 0, views: 0, color: '#F7971C' },
    { id: 5, name: 'Mercado Livre', icon: '🛒', active: true, listings: 5, views: 3201, color: '#FFE600' },
    { id: 6, name: 'Facebook', icon: '📘', active: true, listings: 8, views: 1567, color: '#1877F2' },
    { id: 7, name: 'MeuCarroNovo', icon: '🔑', active: false, listings: 0, views: 0, color: '#00B359' },
    { id: 8, name: 'AutoTrader', icon: '📊', active: true, listings: 3, views: 421, color: '#FF6600' },
    { id: 9, name: 'CarrosBr', icon: '🏎️', active: false, listings: 0, views: 0, color: '#0066CC' },
    { id: 10, name: 'Classi', icon: '📰', active: true, listings: 4, views: 312, color: '#E53935' },
  ],

  users: [
    { id: 1, name: 'Admin Sistema', email: 'admin@siscar.com', role: 'admin', phone: '(11) 99999-0000', active: true, lastLogin: '2024-05-27 10:30', permissions: { estoque: true, clientes: true, vendas: true, financeiro: true, contratos: true, avaliacoes: true, vistoria: true, integrador: true, relatorios: true, configuracoes: true, usuarios: true } },
    { id: 2, name: 'Carlos Vendedor', email: 'carlos@siscar.com', role: 'vendedor', phone: '(11) 98765-1234', active: true, lastLogin: '2024-05-27 08:15', permissions: { estoque: true, clientes: true, vendas: true, financeiro: false, contratos: true, avaliacoes: true, vistoria: true, integrador: false, relatorios: false, configuracoes: false, usuarios: false } },
    { id: 3, name: 'Maria Vendedora', email: 'maria@siscar.com', role: 'vendedor', phone: '(11) 97654-5678', active: true, lastLogin: '2024-05-26 17:45', permissions: { estoque: true, clientes: true, vendas: true, financeiro: false, contratos: true, avaliacoes: true, vistoria: true, integrador: false, relatorios: false, configuracoes: false, usuarios: false } },
    { id: 4, name: 'João Gerente', email: 'joao@siscar.com', role: 'gerente', phone: '(11) 96543-9012', active: true, lastLogin: '2024-05-27 09:00', permissions: { estoque: true, clientes: true, vendas: true, financeiro: true, contratos: true, avaliacoes: true, vistoria: true, integrador: true, relatorios: true, configuracoes: false, usuarios: false } },
  ],

  storeConfig: {
    name: 'Siscar Veículos',
    cnpj: '12.345.678/0001-90',
    address: 'Av. das Nações, 1500 - São Paulo/SP',
    phone: '(11) 3456-7890',
    whatsapp: '(11) 99999-9999',
    email: 'contato@siscarveiculos.com.br',
    website: 'www.siscarveiculos.com.br',
    logo: '',
    commissionRate: 3,
  }
};

/* ── Utility Functions ─────────────────────────────────────────── */
const Utils = {
  formatCurrency: (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  },

  formatDate: (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  },

  formatNumber: (num) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  },

  formatKm: (km) => {
    return Utils.formatNumber(km) + ' km';
  },

  getStatusBadge: (status) => {
    const map = {
      disponivel:  { label: 'Disponível',  cls: 'badge-success' },
      reservado:   { label: 'Reservado',   cls: 'badge-warning' },
      vendido:     { label: 'Vendido',     cls: 'badge-muted'   },
      concluida:   { label: 'Concluída',   cls: 'badge-success' },
      pendente:    { label: 'Pendente',    cls: 'badge-warning' },
      cancelada:   { label: 'Cancelada',   cls: 'badge-danger'  },
      aprovada:    { label: 'Aprovada',    cls: 'badge-success' },
      recusada:    { label: 'Recusada',    cls: 'badge-danger'  },
      recebido:    { label: 'Recebido',    cls: 'badge-success' },
      pago:        { label: 'Pago',        cls: 'badge-success' },
      a_pagar:     { label: 'A Pagar',     cls: 'badge-warning' },
      a_receber:   { label: 'A Receber',   cls: 'badge-info'    },
    };
    const s = map[status] || { label: status, cls: 'badge-muted' };
    return `<span class="badge ${s.cls}">${s.label}</span>`;
  },

  getRoleBadge: (role) => {
    const map = {
      admin:    { label: 'Admin',    cls: 'badge-danger'  },
      gerente:  { label: 'Gerente', cls: 'badge-warning' },
      vendedor: { label: 'Vendedor',cls: 'badge-info'    },
    };
    const r = map[role] || { label: role, cls: 'badge-muted' };
    return `<span class="badge ${r.cls}">${r.label}</span>`;
  },

  getCategoryIcon: (cat) => {
    const icons = { Sedan: '🚗', SUV: '🚙', Hatch: '🚘', Pickup: '🛻', Van: '🚐', Moto: '🏍️', Caminhão: '🚛' };
    return icons[cat] || '🚗';
  },

  getFuelLabel: (fuel) => {
    const labels = { flex: 'Flex', gasolina: 'Gasolina', diesel: 'Diesel', eletrico: 'Elétrico', hibrido: 'Híbrido' };
    return labels[fuel] || fuel;
  },

  // Avatar initials from name
  getInitials: (name) => {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  },

  // Avatar color from name
  getAvatarColor: (name) => {
    const colors = ['#E22446', '#4A9DFF', '#00C896', '#FFB300', '#9B59B6', '#E67E22'];
    let hash = 0;
    for (let c of name) hash += c.charCodeAt(0);
    return colors[hash % colors.length];
  },

  debounce: (fn, wait = 300) => {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
  },

  generateId: () => Math.random().toString(36).slice(2, 10),

  // Count vehicles by status
  stockCounts: () => {
    const counts = { disponivel: 0, reservado: 0, vendido: 0 };
    for (const v of SiscarData.vehicles) counts[v.status] = (counts[v.status] || 0) + 1;
    return counts;
  },

  // Monthly revenue
  monthlyRevenue: () => {
    return SiscarData.sales.reduce((acc, s) => acc + s.salePrice, 0);
  },

  // Total stock value
  stockValue: () => {
    return SiscarData.vehicles.filter(v => v.status !== 'vendido').reduce((acc, v) => acc + v.salePrice, 0);
  },

  // Average profit margin
  avgProfit: () => {
    const avail = SiscarData.vehicles.filter(v => v.status !== 'vendido');
    if (!avail.length) return 0;
    return avail.reduce((acc, v) => acc + (v.salePrice - v.purchasePrice), 0) / avail.length;
  }
};

/* ── Toast Notifications ───────────────────────────────────────── */
const Toast = {
  container: null,

  init() {
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  show(type, title, message, duration = 4000) {
    if (!this.container) this.init();

    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-icon">${icons[type] || 'ℹ️'}</div>
      <div class="toast-content">
        <div class="toast-title">${title}</div>
        ${message ? `<div class="toast-message">${message}</div>` : ''}
      </div>
      <span class="toast-close" onclick="this.parentElement.remove()">✕</span>
    `;
    this.container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  success: (title, msg) => Toast.show('success', title, msg),
  error:   (title, msg) => Toast.show('error',   title, msg),
  warning: (title, msg) => Toast.show('warning', title, msg),
  info:    (title, msg) => Toast.show('info',    title, msg),
};

/* ── Modal Manager ─────────────────────────────────────────────── */
const Modal = {
  open(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    }
  },

  close(id) {
    const overlay = document.getElementById(id);
    if (overlay) {
      overlay.classList.remove('active');
      document.body.style.overflow = '';
    }
  },

  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => {
      m.classList.remove('active');
    });
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    Modal.closeAll();
  }
});

/* ── Sidebar / Dashboard Layout ────────────────────────────────── */
const Dashboard = {
  init() {
    this.setupSidebar();
    this.setupNavItems();
    this.setupSearch();
  },

  setupSidebar() {
    const toggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const close = document.querySelector('.sidebar-close');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
      });
    }

    if (close && sidebar) {
      close.addEventListener('click', () => {
        sidebar.classList.remove('open');
      });
    }

    // Close sidebar on outside click (mobile)
    document.addEventListener('click', (e) => {
      if (sidebar && window.innerWidth <= 1024) {
        if (!sidebar.contains(e.target) && !toggle?.contains(e.target)) {
          sidebar.classList.remove('open');
        }
      }
    });
  },

  setupNavItems() {
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-item[href]').forEach(item => {
      const href = item.getAttribute('href').split('/').pop();
      if (href === currentPath) {
        item.classList.add('active');
      }
    });
  },

  setupSearch() {
    const searchInput = document.querySelector('.topbar-search input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          Toast.info('Busca', `Buscando por: "${searchInput.value}"`);
        }
      });
    }
  }
};

/* ── Intersection Observer for animations ──────────────────────── */
const AnimObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      AnimObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('[data-animate]').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  AnimObserver.observe(el);
});

/* ── Counter Animation ─────────────────────────────────────────── */
function animateCounter(el, target, duration = 1500, prefix = '', suffix = '') {
  const start = 0;
  const increment = target / (duration / 16);
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    const display = target >= 1000
      ? Utils.formatNumber(Math.floor(current))
      : Math.floor(current);
    el.textContent = prefix + display + suffix;
  }, 16);
}

/* ── Export ────────────────────────────────────────────────────── */
window.SiscarData = SiscarData;
window.Utils = Utils;
window.Toast = Toast;
window.Modal = Modal;
window.Dashboard = Dashboard;
window.animateCounter = animateCounter;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();

  // Init dashboard if on admin page
  if (document.querySelector('.app-layout')) {
    Dashboard.init();
  }
});
