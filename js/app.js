/* ═══════════════════════════════════════════════════════════════
   SISCAR — APP.JS — Core utilities, routing, shared components
   ═══════════════════════════════════════════════════════════════ */

/* ── Utility Functions ─────────────────────────────────────────── */
const Utils = {
  formatCurrency: (val) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  },

  formatDate: (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return date.toLocaleDateString('pt-BR');
  },

  formatDateTime: (dateStr) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleString('pt-BR');
  },

  formatRelative: (dateStr) => {
    if (!dateStr) return '-';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return 'agora mesmo';
    if (mins < 60) return `há ${mins} minuto${mins > 1 ? 's' : ''}`;
    if (hrs < 24) return `há ${hrs} hora${hrs > 1 ? 's' : ''}`;
    if (days === 1) return 'ontem';
    if (days < 7) return `há ${days} dias`;
    return Utils.formatDate(dateStr);
  },

  formatNumber: (num) => {
    return new Intl.NumberFormat('pt-BR').format(num || 0);
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
      ok:          { label: 'OK',          cls: 'badge-success' },
      atencao:     { label: 'Atenção',     cls: 'badge-warning' },
      problema:    { label: 'Problema',    cls: 'badge-danger'  },
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

  getInitials: (name) => {
    if (!name) return '??';
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
  },

  getAvatarColor: (name) => {
    const colors = ['#E22446', '#4A9DFF', '#00C896', '#FFB300', '#9B59B6', '#E67E22'];
    let hash = 0;
    for (let c of (name || '')) hash += c.charCodeAt(0);
    return colors[hash % colors.length];
  },

  debounce: (fn, wait = 300) => {
    let timer;
    return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), wait); };
  },

  generateId: () => Math.random().toString(36).slice(2, 10),

  // Export to CSV
  exportCSV: (headers, rows, filename = 'relatorio.csv') => {
    const csvContent = [
      headers.join(';'),
      ...rows.map(r => r.join(';'))
    ].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  },

  // Sanitize HTML
  safe: (str) => {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }
};

/* ── Toast Notifications ───────────────────────────────────────── */
const Toast = {
  container: null,

  init() {
    if (this.container) return;
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
        <div class="toast-title">${Utils.safe(title)}</div>
        ${message ? `<div class="toast-message">${Utils.safe(message)}</div>` : ''}
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
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
    document.body.style.overflow = '';
  }
};

// Close modal on overlay click
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) Modal.closeAll();
});

/* ── Dashboard Layout (sidebar/topbar) ─────────────────────────── */
const Dashboard = {
  init() {
    this.setupSidebar();
    this.setupNavItems();
    this.loadUserInfo();
  },

  setupSidebar() {
    const toggle = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.sidebar');
    const close = document.querySelector('.sidebar-close');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
    }
    if (close && sidebar) {
      close.addEventListener('click', () => sidebar.classList.remove('open'));
    }
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
      if (href === currentPath) item.classList.add('active');
    });
  },

  loadUserInfo() {
    const session = (window.Auth && Auth.getSession) ? Auth.getSession() : null;
    const user = session || JSON.parse(localStorage.getItem('siscar_current_user') || '{"name":"Admin","role":"admin"}');
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const welcomeEl = document.getElementById('welcome-name');
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role === 'admin' ? 'Administrador' : user.role === 'gerente' ? 'Gerente' : 'Vendedor';
    if (avatarEl) avatarEl.textContent = Utils.getInitials(user.name);
    if (welcomeEl) welcomeEl.textContent = user.name.split(' ')[0];

    // Melhorando a visibilidade do botão de logout
    const logoutBtn = document.querySelector('.user-logout');
    if (logoutBtn) {
      logoutBtn.innerHTML = '🚪 Sair';
      logoutBtn.style.cursor = 'pointer';
      logoutBtn.style.fontSize = '0.9rem';
      logoutBtn.style.color = 'var(--danger)';
      logoutBtn.style.fontWeight = '600';
      logoutBtn.style.display = 'flex';
      logoutBtn.style.alignItems = 'center';
      logoutBtn.style.gap = '4px';
    }

    // Store info from DB
    if (window.SiscarDB) {
      SiscarDB.getConfig().then(cfg => {
        const storeNameEl = document.querySelector('.store-name');
        if (storeNameEl && cfg.name) storeNameEl.textContent = cfg.name;
      }).catch(() => {});
    }
  }
};

/* ── Logout ─────────────────────────────────────────────────────── */
window.logout = function() {
  if (window.Auth) Auth.clearSession();
  localStorage.removeItem('siscar_session');
  localStorage.removeItem('siscar_current_user');
  // Detect se está em pages ou na raiz
  const inPages = window.location.pathname.includes('/pages/');
  window.location.href = inPages ? 'login.html' : 'pages/login.html';
};

/* ── Auth Guard — protege páginas internas ──────────────────────── */
(function setupAuthGuard() {
  const isLoginPage = window.location.pathname.includes('login.html');
  const isIndexPage = window.location.pathname === '/' || window.location.pathname.endsWith('index.html') || window.location.pathname === '';
  if (isLoginPage || isIndexPage) return; // Login e landing não precisam de guard

  function runGuard() {
    if (!window.Auth) return;
    const session = Auth.getSession();
    if (!session) {
      window.location.href = 'login.html';
      return;
    }
    // Hide nav items by permission (non-admin)
    if (session.role !== 'admin' && session.permissions) {
      const permMap = {
        'financeiro.html':    'financeiro',
        'relatorios.html':    'relatorios',
        'configuracoes.html': 'configuracoes',
        'usuarios.html':      'usuarios',
        'integrador.html':    'integrador',
      };
      const currentPage = window.location.pathname.split('/').pop();
      const requiredPerm = permMap[currentPage];
      if (requiredPerm && !session.permissions[requiredPerm]) {
        window.location.href = 'dashboard.html';
        return;
      }
    }
  }

  // Guard runs as soon as DB is ready
  window.addEventListener('siscar-db-ready', runGuard, { once: true });
  // Fallback if DB already loaded
  if (window.Auth) runGuard();
})();

/* ── Counter Animation ─────────────────────────────────────────── */
function animateCounter(el, target, duration = 1500, prefix = '', suffix = '') {
  const increment = target / (duration / 16);
  let current = 0;
  const timer = setInterval(() => {
    current += increment;
    if (current >= target) { current = target; clearInterval(timer); }
    const display = target >= 1000
      ? Utils.formatNumber(Math.floor(current))
      : Math.floor(current);
    el.textContent = prefix + display + suffix;
  }, 16);
}

/* ── IntersectionObserver for animations ───────────────────────── */
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

/* ── Confirm Dialog ────────────────────────────────────────────── */
window.SiscarConfirm = function(message, onConfirm) {
  const existing = document.getElementById('siscar-confirm-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'siscar-confirm-overlay';
  overlay.className = 'modal-overlay active';
  overlay.innerHTML = `
    <div class="modal" style="max-width:400px;">
      <div class="modal-header">
        <h3 class="modal-title">⚠️ Confirmação</h3>
      </div>
      <div class="modal-body">
        <p style="color:var(--text-secondary);margin:0;">${message}</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" id="confirm-cancel">Cancelar</button>
        <button class="btn btn-primary" id="confirm-ok" style="background:var(--danger);">Confirmar</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.body.style.overflow = 'hidden';

  document.getElementById('confirm-cancel').onclick = () => { overlay.remove(); document.body.style.overflow = ''; };
  document.getElementById('confirm-ok').onclick = () => {
    overlay.remove();
    document.body.style.overflow = '';
    onConfirm();
  };
};

/* ── Export ────────────────────────────────────────────────────── */
window.Utils = Utils;
window.Toast = Toast;
window.Modal = Modal;
window.Dashboard = Dashboard;
window.animateCounter = animateCounter;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  if (document.querySelector('.app-layout')) {
    Dashboard.init();
  }
});
