/* ═══════════════════════════════════════════════════════════════
   SISCAR — SIDEBAR.JS — Shared sidebar HTML injection + scripts
   ═══════════════════════════════════════════════════════════════ */

(function injectSidebar() {
  const currentPage = window.location.pathname.split('/').pop();
  const sidebarEl = document.querySelector('.sidebar');
  if (!sidebarEl) return;

  const navItems = [
    { href: 'dashboard.html', icon: '🏠', label: 'Dashboard', section: 'Principal' },
    { href: 'estoque.html', icon: '🚗', label: 'Estoque', section: 'Operação' },
    { href: 'clientes.html', icon: '👥', label: 'Clientes (CRM)', section: null },
    { href: 'vendas.html', icon: '💰', label: 'Vendas', section: null },
    { href: 'financeiro.html', icon: '📈', label: 'Financeiro', section: null },
    { href: 'contratos.html', icon: '📄', label: 'Contratos', section: 'Ferramentas' },
    { href: 'avaliacoes.html', icon: '⭐', label: 'Avaliação Pro', section: null },
    { href: 'vistoria.html', icon: '🔍', label: 'Vistoria', section: null },
    { href: 'integrador.html', icon: '🌐', label: 'Integrador', section: null },
    { href: 'relatorios.html', icon: '📊', label: 'Relatórios', section: 'Gestão' },
    { href: 'configuracoes.html', icon: '⚙️', label: 'Configurações', section: null },
    { href: 'usuarios.html', icon: '👤', label: 'Usuários', section: null },
  ];

  let navHTML = '';
  let lastSection = null;
  navItems.forEach(item => {
    if (item.section && item.section !== lastSection) {
      navHTML += `<div class="nav-section-label">${item.section}</div>`;
      lastSection = item.section;
    }
    const isActive = item.href === currentPage;
    navHTML += `
      <a href="${item.href}" class="nav-item${isActive ? ' active' : ''}">
        <span class="nav-icon">${item.icon}</span>
        <span>${item.label}</span>
      </a>`;
  });

  sidebarEl.innerHTML = `
    <div class="sidebar-header">
      <a href="../index.html" class="sidebar-logo">
        <div class="logo-icon">🚗</div>
        <span>Sis<span class="brand-accent">car</span></span>
      </a>
      <button class="sidebar-close">✕</button>
    </div>
    <div class="sidebar-store">
      <div class="store-avatar" id="store-avatar-letter">SV</div>
      <div class="user-info">
        <div class="store-name" id="store-name-sidebar">Siscar Veículos</div>
        <div class="store-plan">Plano Pro ★</div>
      </div>
    </div>
    <nav class="sidebar-nav">${navHTML}</nav>
    <div class="sidebar-footer">
      <div class="user-profile">
        <div class="avatar avatar-sm" id="sidebar-user-avatar">AD</div>
        <div class="user-info">
          <div class="user-name" id="sidebar-user-name">Admin</div>
          <div class="user-role" id="sidebar-user-role">Administrador</div>
        </div>
        <div class="user-logout" onclick="logout()" title="Sair">🚪</div>
      </div>
    </div>
  `;

  // Load store name from DB when ready
  const updateStoreName = async () => {
    if (!window.SiscarDB) return;
    const config = await SiscarDB.getConfig().catch(() => ({}));
    const el = document.getElementById('store-name-sidebar');
    if (el && config.name) el.textContent = config.name;
    const avatarEl = document.getElementById('store-avatar-letter');
    if (avatarEl && config.name) avatarEl.textContent = config.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
  };

  if (window.SiscarDB) updateStoreName();
  window.addEventListener('siscar-db-ready', updateStoreName, { once: true });
})();
