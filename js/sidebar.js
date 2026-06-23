/* ═══════════════════════════════════════════════════════════════
   SISCAR — SIDEBAR.JS v2.0 — Multi-Tenant
   Sidebar compartilhado com dados do tenant via API
   ═══════════════════════════════════════════════════════════════ */

(function injectSidebar() {
  const currentPage = window.location.pathname.split('/').pop();
  const sidebarEl = document.querySelector('.sidebar');
  if (!sidebarEl) return;

  const navItems = [
    { href: 'dashboard.html',    icon: '🏠', label: 'Dashboard',     section: 'Principal' },
    { href: 'estoque.html',      icon: '🚗', label: 'Estoque',       section: 'Operação', perm: 'estoque' },
    { href: 'clientes.html',     icon: '👥', label: 'Clientes (CRM)',section: null,       perm: 'clientes' },
    { href: 'vendas.html',       icon: '💰', label: 'Vendas',        section: null,       perm: 'vendas' },
    { href: 'financeiro.html',   icon: '📈', label: 'Financeiro',    section: null,       perm: 'financeiro' },
    { href: 'contratos.html',    icon: '📄', label: 'Contratos',     section: 'Ferramentas', perm: 'contratos' },
    { href: 'avaliacoes.html',   icon: '⭐', label: 'Avaliação Pro', section: null,       perm: 'avaliacoes' },
    { href: 'vistoria.html',     icon: '🔍', label: 'Vistoria',      section: null,       perm: 'vistoria' },
    { href: 'integrador.html',   icon: '🌐', label: 'Integrador',    section: null,       perm: 'integrador' },
    { href: 'relatorios.html',   icon: '📊', label: 'Relatórios',    section: 'Gestão',   perm: 'relatorios' },
    { href: 'configuracoes.html',icon: '⚙️', label: 'Configurações', section: null,       perm: 'configuracoes' },
    { href: 'usuarios.html',     icon: '👤', label: 'Usuários',      section: null,       perm: 'usuarios' },
  ];

  function buildNav() {
    let navHTML = '';
    let lastSection = null;
    navItems.forEach(item => {
      // Oculta itens sem permissão
      if (item.perm && window.Auth && !Auth.hasPermission(item.perm)) return;

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
    return navHTML;
  }

  function getPlanBadge(plan) {
    const labels = { trial: 'Trial ⏳', starter: 'Starter', pro: 'Pro ★', enterprise: 'Enterprise 🏆' };
    return labels[plan] || plan;
  }

  function renderSidebar(storeName = 'Siscar Veículos', plan = 'pro', userName = 'Admin', userRole = 'admin') {
    const avatarLetters = storeName.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    const userInitials  = userName.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
    const roleLabel = { admin: 'Administrador', gerente: 'Gerente', vendedor: 'Vendedor' }[userRole] || userRole;

    sidebarEl.innerHTML = `
      <div class="sidebar-header">
        <a href="../index.html" class="sidebar-logo">
          <div class="logo-icon">🚗</div>
          <span>Sis<span class="brand-accent">car</span></span>
        </a>
        <button class="sidebar-close">✕</button>
      </div>
      <div class="sidebar-store">
        <div class="store-avatar" id="store-avatar-letter">${avatarLetters}</div>
        <div class="user-info">
          <div class="store-name" id="store-name-sidebar">${storeName}</div>
          <div class="store-plan">${getPlanBadge(plan)}</div>
        </div>
      </div>
      <nav class="sidebar-nav">${buildNav()}</nav>
      <div class="sidebar-footer">
        <div class="user-profile">
          <div class="avatar avatar-sm" id="sidebar-user-avatar">${userInitials}</div>
          <div class="user-info">
            <div class="user-name" id="sidebar-user-name">${userName}</div>
            <div class="user-role" id="sidebar-user-role">${roleLabel}</div>
          </div>
          <div class="user-logout" onclick="logout()" title="Sair">🚪</div>
        </div>
      </div>
    `;
  }

  // Render inicial com dados padrão (antes da API responder)
  renderSidebar();

  // Atualiza com dados reais da sessão/API
  async function updateFromSession() {
    const session = window.Auth?.getSession?.();
    if (!session) return;

    const { user, tenant } = session;
    renderSidebar(
      tenant?.name || 'Siscar Veículos',
      tenant?.plan || 'pro',
      user?.name || 'Admin',
      user?.role || 'admin'
    );

    // Tenta buscar config da loja para nome mais atualizado
    try {
      const config = await SiscarAPI.getConfig();
      if (config?.name) {
        const el = document.getElementById('store-name-sidebar');
        const av = document.getElementById('store-avatar-letter');
        if (el) el.textContent = config.name;
        if (av) av.textContent = config.name.split(' ').slice(0,2).map(w => w[0]).join('').toUpperCase();
      }
    } catch { /* ignora */ }
  }

  if (window.Auth?.getSession?.()) {
    updateFromSession();
  }
  window.addEventListener('siscar-db-ready', updateFromSession, { once: true });
})();

/* ── Logout global ────────────────────────────────────────────────── */
window.logout = async function() {
  try {
    await SiscarAPI.logout();
  } catch { /* ignora */ }
  finally {
    Auth.clearSession();
    window.location.href = '../pages/login.html';
  }
};
