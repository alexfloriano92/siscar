/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/DASHBOARD.JS
   Estatísticas do dashboard por tenant
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, parseJSON } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/stats', (req, res) => {
  const tid = req.tenantId;

  const vehicles = db.prepare('SELECT status, purchase_price, sale_price FROM vehicles WHERE tenant_id = ?').all(tid);
  const sales = db.prepare('SELECT * FROM sales WHERE tenant_id = ? ORDER BY created_at DESC LIMIT 5').all(tid);
  const activities = db.prepare('SELECT a.*, u.name as user_name FROM activities a LEFT JOIN users u ON a.user_id = u.id WHERE a.tenant_id = ? ORDER BY a.created_at DESC LIMIT 20').all(tid);

  // KPIs de financeiro do mês atual
  const now = new Date();
  const monthStart = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`;
  const fin = db.prepare('SELECT type, SUM(amount) as total FROM financials WHERE tenant_id = ? AND date >= ? GROUP BY type').all(tid, monthStart);
  const receitas = fin.find(f => f.type === 'receita')?.total || 0;
  const despesas = fin.find(f => f.type === 'despesa')?.total || 0;

  // Contagens de veículos
  const counts = { disponivel: 0, reservado: 0, vendido: 0 };
  vehicles.forEach(v => counts[v.status] = (counts[v.status] || 0) + 1);

  // Valor total do estoque disponível
  const stockValue = vehicles.filter(v => v.status !== 'vendido').reduce((a, v) => a + (v.sale_price || 0), 0);

  // Lucro médio por veículo
  const avail = vehicles.filter(v => v.status !== 'vendido');
  const avgProfit = avail.length ? avail.reduce((a, v) => a + ((v.sale_price || 0) - (v.purchase_price || 0)), 0) / avail.length : 0;

  // Vendas do mês
  const monthlySales = db.prepare("SELECT COUNT(*) as count, SUM(sale_price) as total FROM sales WHERE tenant_id = ? AND date >= ? AND status = 'concluida'").get(tid, monthStart);

  // Gráfico de vendas dos últimos 6 meses
  const chartData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const from = `${y}-${m}-01`;
    const to = `${y}-${m}-31`;
    const result = db.prepare("SELECT SUM(sale_price) as total FROM sales WHERE tenant_id = ? AND date BETWEEN ? AND ? AND status = 'concluida'").get(tid, from, to);
    chartData.push({ month: `${m}/${y}`, total: result?.total || 0 });
  }

  res.json({
    counts,
    totalVehicles: vehicles.length,
    stockValue,
    avgProfit,
    monthReceitas: receitas,
    monthDespesas: despesas,
    monthSaldo: receitas - despesas,
    monthlySalesCount: monthlySales.count || 0,
    monthlySalesTotal: monthlySales.total || 0,
    recentSales: sales,
    recentActivities: activities,
    chartData,
  });
});

module.exports = router;
