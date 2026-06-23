/* ═══════════════════════════════════════════════════════════════════
   SISCAR — API.JS v2.0
   Cliente HTTP para o backend. Substitui o IndexedDB (db.js).
   Todas as chamadas são autenticadas via JWT.
   ═══════════════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── Configuração ─────────────────────────────────────────────── */
  const API_BASE = (function () {
    // Detecta automaticamente o servidor
    if (window.location.protocol === 'file:') {
      return 'http://localhost:3001/api/v1';
    }
    const { protocol, hostname, port } = window.location;
    // Se rodando no próprio servidor (porta 3001), usa mesma origin
    if (port === '3001') return `${protocol}//${hostname}:3001/api/v1`;
    // Live Server / VSCode
    if (port === '5500' || port === '5501') return 'http://localhost:3001/api/v1';
    // Produção: mesma origin
    return '/api/v1';
  })();

  /* ── Auth Session ─────────────────────────────────────────────── */
  const SESSION_KEY = 'siscar_session_v2';
  const TOKEN_KEY   = 'siscar_token_v2';

  const Auth = {
    getToken()    { return localStorage.getItem(TOKEN_KEY); },
    setToken(t)   { localStorage.setItem(TOKEN_KEY, t); },
    getSession()  {
      const s = localStorage.getItem(SESSION_KEY);
      return s ? JSON.parse(s) : null;
    },
    setSession(data) {
      localStorage.setItem(SESSION_KEY, JSON.stringify(data));
    },
    clearSession() {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
      // Limpa legado
      localStorage.removeItem('siscar_session');
      localStorage.removeItem('siscar_current_user');
    },
    requireAuth(redirectTo = null) {
      const session = Auth.getSession();
      const token   = Auth.getToken();
      if (!session || !token) {
        // Monta URL de redirect
        const loginPage = redirectTo || (
          window.location.pathname.includes('/pages/')
            ? '../pages/login.html'
            : 'pages/login.html'
        );
        // Preserva o slug da loja se existir
        const slug = session?.tenant?.slug;
        window.location.href = slug ? `${loginPage}?loja=${slug}` : loginPage;
        return null;
      }
      return session;
    },
    hasPermission(module) {
      const session = Auth.getSession();
      if (!session) return false;
      if (session.user?.role === 'admin') return true;
      return session.user?.permissions?.[module] === true;
    },
    isExpired() {
      const token = Auth.getToken();
      if (!token) return true;
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() >= payload.exp * 1000;
      } catch { return true; }
    }
  };

  /* ── HTTP Client ──────────────────────────────────────────────── */
  async function request(method, path, body = null, opts = {}) {
    const token = Auth.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body && method !== 'GET') config.body = JSON.stringify(body);

    const url = path.startsWith('http') ? path : `${API_BASE}${path}`;

    try {
      const res = await fetch(url, config);

      // Token expirado — redireciona para login
      if (res.status === 401) {
        const data = await res.json().catch(() => ({}));
        if (!opts.skipAuthRedirect) {
          Auth.clearSession();
          const loginPage = window.location.pathname.includes('/pages/')
            ? '../pages/login.html' : 'pages/login.html';
          window.location.href = loginPage;
          return null;
        }
        throw new Error(data.error || 'Não autenticado.');
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }

      return res.json();
    } catch (err) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        throw new Error('Servidor offline. Verifique se o backend está rodando em http://localhost:3001');
      }
      throw err;
    }
  }

  const get  = (path, params) => {
    const q = params ? '?' + new URLSearchParams(params).toString() : '';
    return request('GET', path + q);
  };
  const post   = (path, body) => request('POST', path, body);
  const put    = (path, body) => request('PUT', path, body);
  const del    = (path)       => request('DELETE', path);

  /* ══════════════════════════════════════════════════════════════
     API — Métodos que mapeiam 1:1 com o antigo SiscarDB
     ══════════════════════════════════════════════════════════════ */
  const SiscarAPI = {

    /* ── Auth ──────────────────────────────────────────────────── */
    async login(email, password, slug) {
      const data = await post('/auth/login', { email, password, slug });
      Auth.setToken(data.token);
      Auth.setSession({ user: data.user, tenant: data.tenant });
      return data;
    },

    async register(email, storeName, name) {
      return post('/auth/register', { email, storeName, name });
    },

    async logout() {
      try { await post('/auth/logout', {}); } catch { /* ignora */ }
      Auth.clearSession();
    },

    async getMe() {
      return get('/auth/me');
    },

    async getTenantInfo(slug) {
      return get(`/auth/tenant/${slug}`, null);
    },

    /* ── Dashboard ─────────────────────────────────────────────── */
    async getDashboardStats() {
      return get('/dashboard/stats');
    },

    /* ── Vehicles ──────────────────────────────────────────────── */
    async getVehicles(filter = {}) {
      return get('/vehicles', filter);
    },
    async getVehicle(id) {
      return get(`/vehicles/${id}`);
    },
    async addVehicle(data) {
      return post('/vehicles', data);
    },
    async updateVehicle(id, data) {
      return put(`/vehicles/${id}`, data);
    },
    async deleteVehicle(id) {
      return del(`/vehicles/${id}`);
    },

    /* ── Clients ───────────────────────────────────────────────── */
    async getClients(filter = {}) {
      return get('/clients', filter);
    },
    async getClient(id) {
      return get(`/clients/${id}`);
    },
    async addClient(data) {
      return post('/clients', data);
    },
    async updateClient(id, data) {
      return put(`/clients/${id}`, data);
    },
    async deleteClient(id) {
      return del(`/clients/${id}`);
    },

    /* ── Sales ─────────────────────────────────────────────────── */
    async getSales(filter = {}) {
      return get('/sales', filter);
    },
    async getSale(id) {
      return get(`/sales/${id}`);
    },
    async addSale(data) {
      return post('/sales', {
        vehicleId: data.vehicleId,
        clientId:  data.clientId,
        date: data.date,
        salePrice: data.salePrice,
        paymentType: data.paymentType,
        financingBank: data.financingBank,
        downPayment: data.downPayment,
        installments: data.installments,
        seller: data.seller,
        sellerId: data.sellerId,
        commission: data.commission,
      });
    },
    async cancelSale(id) {
      return put(`/sales/${id}/cancel`, {});
    },

    /* ── Financials ────────────────────────────────────────────── */
    async getFinancials(filter = {}) {
      return get('/financials', filter);
    },
    async getFinancialSummary(filter = {}) {
      return get('/financials/summary', filter);
    },
    async addFinancial(data) {
      return post('/financials', data);
    },
    async updateFinancial(id, data) {
      return put(`/financials/${id}`, data);
    },
    async deleteFinancial(id) {
      return del(`/financials/${id}`);
    },

    /* ── Evaluations ───────────────────────────────────────────── */
    async getEvaluations(filter = {}) {
      return get('/evaluations', filter);
    },
    async addEvaluation(data) {
      return post('/evaluations', data);
    },
    async updateEvaluation(id, data) {
      return put(`/evaluations/${id}`, data);
    },
    async deleteEvaluation(id) {
      return del(`/evaluations/${id}`);
    },

    /* ── Vistorias ─────────────────────────────────────────────── */
    async getVistorias(filter = {}) {
      return get('/vistorias', filter);
    },
    async addVistoria(data) {
      return post('/vistorias', data);
    },
    async deleteVistoria(id) {
      return del(`/vistorias/${id}`);
    },

    /* ── Portals ───────────────────────────────────────────────── */
    async getPortals() {
      return get('/portals');
    },
    async togglePortal(id) {
      return put(`/portals/${id}/toggle`, {});
    },
    async updatePortal(id, data) {
      return put(`/portals/${id}`, data);
    },

    /* ── Users ─────────────────────────────────────────────────── */
    async getUsers() {
      return get('/users');
    },
    async getUser(id) {
      return get(`/users/${id}`);
    },
    async addUser(data) {
      return post('/users', data);
    },
    async updateUser(id, data) {
      return put(`/users/${id}`, data);
    },
    async deleteUser(id) {
      return del(`/users/${id}`);
    },
    async toggleUser(id) {
      return put(`/users/${id}/toggle`, {});
    },

    /* ── Store Config ──────────────────────────────────────────── */
    async getConfig() {
      return get('/config');
    },
    async setConfig(key, value) {
      return put('/config', { [key]: value });
    },
    async setConfigBulk(obj) {
      return put('/config', obj);
    },

    /* ── Legacy: compat com código antigo que usa SiscarDB ────── */
    async loginUser(email, password) {
      try {
        const slug = new URLSearchParams(window.location.search).get('loja') || 'demo';
        const data = await SiscarAPI.login(email, password, slug);
        return data.user;
      } catch (err) {
        if (err.message?.includes('expirado') || err.message?.includes('PLAN_EXPIRED')) {
          return { error: 'expired' };
        }
        return null;
      }
    },

    async registerTrialUser(email, storeName) {
      try {
        return await SiscarAPI.register(email, storeName || email.split('@')[0] + ' Veículos', null);
      } catch { return null; }
    },

    async logActivity(text, type = 'system') {
      // No backend, atividades são logadas automaticamente
      // Este método existe só para compatibilidade
    },

    /* ── Utilitários ───────────────────────────────────────────── */
    async checkHealth() {
      try {
        const data = await get('/health'.replace('/api/v1', '').replace('api/v1', ''));
        return data.status === 'ok';
      } catch { return false; }
    },
  };

  /* ── Expose Globals ───────────────────────────────────────────── */
  window.SiscarDB  = SiscarAPI; // Compatibilidade total com código existente
  window.SiscarAPI = SiscarAPI;
  window.Auth      = Auth;

  /* ── Auto-init: verifica conexão e dispara evento ─────────────── */
  (async function init() {
    try {
      const res = await fetch(`${API_BASE.replace('/api/v1', '')}/api/v1/health`);
      if (res.ok) {
        window.dispatchEvent(new Event('siscar-db-ready'));
        console.log(`[Siscar API] ✅ Conectado ao backend: ${API_BASE}`);
      } else {
        throw new Error('Backend retornou erro');
      }
    } catch (err) {
      console.error('[Siscar API] ❌ Backend offline:', err.message);
      // Ainda dispara o evento para a página não ficar travada
      window.dispatchEvent(new CustomEvent('siscar-db-ready', { detail: { offline: true } }));
      // Mostra alerta amigável se Toast estiver disponível
      setTimeout(() => {
        if (window.Toast) {
          Toast.error('Servidor Offline', 'Inicie o backend: duplo-clique em backend/iniciar.bat');
        }
      }, 500);
    }
  })();

})();
