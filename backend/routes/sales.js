/* ═══════════════════════════════════════════════════════════════════
   SISCAR — ROUTES/SALES.JS
   ═══════════════════════════════════════════════════════════════════ */
const express = require('express');
const router = express.Router();
const { db, uuid, logActivity } = require('../database');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const { status, dateFrom, dateTo } = req.query;
  let sql = `
    SELECT s.*, v.brand, v.model, v.plate, c.name as client_name
    FROM sales s
    LEFT JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.tenant_id = ?`;
  const params = [req.tenantId];
  if (status) { sql += ' AND s.status = ?'; params.push(status); }
  if (dateFrom) { sql += ' AND s.date >= ?'; params.push(dateFrom); }
  if (dateTo) { sql += ' AND s.date <= ?'; params.push(dateTo); }
  sql += ' ORDER BY s.created_at DESC';
  res.json(db.prepare(sql).all(...params));
});

router.get('/:id', (req, res) => {
  const sale = db.prepare(`
    SELECT s.*, v.brand, v.model, v.plate, v.color, v.year,
           c.name as client_name, c.cpf, c.phone, c.email as client_email
    FROM sales s
    LEFT JOIN vehicles v ON s.vehicle_id = v.id
    LEFT JOIN clients c ON s.client_id = c.id
    WHERE s.id = ? AND s.tenant_id = ?`).get(req.params.id, req.tenantId);
  if (!sale) return res.status(404).json({ error: 'Venda não encontrada.' });
  res.json(sale);
});

router.post('/', (req, res) => {
  const { vehicleId, clientId, date, salePrice, paymentType, financingBank, downPayment, installments, seller, sellerId, commission } = req.body;
  if (!vehicleId || !clientId) return res.status(400).json({ error: 'Veículo e cliente são obrigatórios.' });

  // Verifica se veículo pertence ao tenant
  const vehicle = db.prepare('SELECT * FROM vehicles WHERE id = ? AND tenant_id = ?').get(vehicleId, req.tenantId);
  if (!vehicle) return res.status(404).json({ error: 'Veículo não encontrado.' });

  const id = uuid();
  db.prepare(`INSERT INTO sales (id,tenant_id,vehicle_id,client_id,date,sale_price,payment_type,financing_bank,down_payment,installments,seller,seller_id,commission,status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,'concluida')`)
    .run(id, req.tenantId, vehicleId, clientId, date || new Date().toISOString().split('T')[0], salePrice || 0, paymentType || 'a_vista', financingBank || '', downPayment || 0, installments || 0, seller || req.user.name, sellerId || req.user.id, commission || 0);

  // Atualiza status do veículo para vendido
  db.prepare("UPDATE vehicles SET status = 'vendido' WHERE id = ? AND tenant_id = ?").run(vehicleId, req.tenantId);

  // Cria lançamento financeiro automático
  const client = db.prepare('SELECT name FROM clients WHERE id = ?').get(clientId);
  db.prepare('INSERT INTO financials (id,tenant_id,type,category,description,amount,date,status,sale_id) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(uuid(), req.tenantId, 'receita', 'Venda de Veículo', `Venda ${vehicle.brand} ${vehicle.model} — ${client?.name || ''}`, salePrice || 0, date || new Date().toISOString().split('T')[0], 'recebido', id);

  logActivity(req.tenantId, `Venda registrada: ${vehicle.brand} ${vehicle.model}`, 'sale', req.user.id);
  res.status(201).json(db.prepare('SELECT * FROM sales WHERE id = ?').get(id));
});

router.put('/:id/cancel', (req, res) => {
  const sale = db.prepare('SELECT * FROM sales WHERE id = ? AND tenant_id = ?').get(req.params.id, req.tenantId);
  if (!sale) return res.status(404).json({ error: 'Venda não encontrada.' });

  db.prepare("UPDATE sales SET status = 'cancelada' WHERE id = ? AND tenant_id = ?").run(req.params.id, req.tenantId);
  db.prepare("UPDATE vehicles SET status = 'disponivel' WHERE id = ? AND tenant_id = ?").run(sale.vehicle_id, req.tenantId);
  db.prepare('DELETE FROM financials WHERE sale_id = ? AND tenant_id = ?').run(req.params.id, req.tenantId);

  logActivity(req.tenantId, `Venda #${req.params.id.substring(0,8)} cancelada`, 'sale', req.user.id);
  res.json({ message: 'Venda cancelada.' });
});

module.exports = router;
