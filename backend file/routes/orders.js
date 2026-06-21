const express = require('express');
const { readFile, writeFile, getNextId } = require('../utils/fileStorage');
const { authenticate, requireManager, optionalAuthenticate } = require('../middleware/auth');

const router = express.Router();
const ORDERS_FILE = 'orders.json';

router.get('/', authenticate, requireManager, (req, res) => {
  try {
    res.json(readFile(ORDERS_FILE));
  } catch (error) {
    res.status(500).json({ error: 'Server database read error' });
  }
});

router.get('/my-orders', authenticate, (req, res) => {
  try {
    const orders = readFile(ORDERS_FILE);
    const userOrders = orders.filter(o => o.userId === req.user.id); // Optimized lookup validation parameters match
    res.json(userOrders);
  } catch (error) {
    res.status(500).json({ error: 'Server database process fault' });
  }
});

// 🔥 FIX: Added optionalAuthenticate so req.user can be verified if present
router.post('/', optionalAuthenticate, (req, res) => {
  try {
    const { customerName, customerEmail, items, total, paymentMethod, deliveryInfo, notes } = req.body;

    if (!items || !items.length) {
      return res.status(400).json({ error: 'Order parameters invalid: Empty cart context summary' });
    }

    const orders = readFile(ORDERS_FILE);
    const newOrder = {
      id: getNextId(ORDERS_FILE),
      customerName: customerName || (req.user ? req.user.username : 'Guest'),
      customerEmail: customerEmail || (req.user ? req.user.email : 'guest@checkout.com'),
      orderDate: new Date().toISOString(),
      items: items.map(item => ({
        name: item.name,
        price: parseFloat(item.price),
        qty: parseInt(item.qty),
        selectedColor: item.selectedColor || '—',
        selectedSize: item.selectedSize || '—'
      })),
      total: total || items.reduce((sum, i) => sum + (i.price * i.qty), 0),
      paymentMethod: paymentMethod || 'Credit Card',
      status: 'pending',
      deliveryInfo: deliveryInfo || null,
      notes: notes || '',
      userId: req.user ? req.user.id : null // 🔥 Now accurately records user identities instead of resolving as null
    };

    orders.push(newOrder);
    writeFile(ORDERS_FILE, orders);

    console.log(`📧 Notification Invoice Logged: Dispatching Order #${newOrder.id} context tracking alerts.`);
    res.status(201).json(newOrder);
  } catch (error) {
    console.error('Order creation exception:', error);
    res.status(500).json({ error: 'Server database record error' });
  }
});

router.put('/:id/status', authenticate, requireManager, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    let orders = readFile(ORDERS_FILE);
    const order = orders.find(o => o.id === id);
    if (!order) return res.status(404).json({ error: 'Target transaction reference unallocated' });

    order.status = status;
    order.lastUpdated = new Date().toISOString();
    writeFile(ORDERS_FILE, orders);

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Server database write failure' });
  }
});

module.exports = router;