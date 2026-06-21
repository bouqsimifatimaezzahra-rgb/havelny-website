const express = require('express');
const { readFile, writeFile } = require('../utils/fileStorage');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const CART_FILE = 'carts.json';

function fetchAllCarts() {
  return readFile(CART_FILE);
}

router.get('/', authenticate, (req, res) => {
  try {
    const carts = fetchAllCarts();
    const activeCart = carts.find(c => String(c.userId) === String(req.user.id));
    res.json(activeCart ? activeCart.items : []);
  } catch (error) {
    res.status(500).json({ error: 'Error pulling active account shopping configurations.' });
  }
});

router.post('/', authenticate, (req, res) => {
  try {
    const { productId, name, price, img, selectedColor, selectedSize } = req.body;

    if (!productId || !name || !price) {
      return res.status(400).json({ error: 'Incomplete parameters mapped to cart creation action.' });
    }

    let carts = fetchAllCarts();
    let userCart = carts.find(c => String(c.userId) === String(req.user.id));

    if (!userCart) {
      userCart = { userId: req.user.id, items: [] };
      carts.push(userCart);
    }

    const itemMatchIndex = userCart.items.findIndex(i => 
      String(i.productId) === String(productId) && 
      String(i.selectedColor) === String(selectedColor || '—') && 
      String(i.selectedSize) === String(selectedSize || '—')
    );

    if (itemMatchIndex !== -1) {
      userCart.items[itemMatchIndex].qty += 1;
    } else {
      userCart.items.push({
        productId: String(productId),
        name: name.trim(),
        price: parseFloat(price),
        qty: 1,
        img: img || 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
        selectedColor: selectedColor || '—',
        selectedSize: selectedSize || '—'
      });
    }

    writeFile(CART_FILE, carts);
    res.json(userCart.items);
  } catch (error) {
    res.status(500).json({ error: 'Insertion allocation pipeline error within shopping cart matrix.' });
  }
});

router.put('/', authenticate, (req, res) => {
  try {
    const { productId, selectedColor, selectedSize, qty } = req.body;

    if (!productId || qty === undefined) {
      return res.status(400).json({ error: 'Target metrics missing for cart entity adjustment operations.' });
    }

    let carts = fetchAllCarts();
    const userCart = carts.find(c => String(c.userId) === String(req.user.id));
    if (!userCart) return res.status(404).json({ error: 'Shopping cart entity instance unallocated.' });

    const targetIndex = userCart.items.findIndex(i => 
      String(i.productId) === String(productId) && 
      String(i.selectedColor) === String(selectedColor || '—') && 
      String(i.selectedSize) === String(selectedSize || '—')
    );

    if (targetIndex === -1) return res.status(404).json({ error: 'Item profile unallocated in shopping registry.' });

    const standardQty = Math.max(0, parseInt(qty));
    if (standardQty === 0) {
      userCart.items.splice(targetIndex, 1);
    } else {
      userCart.items[targetIndex].qty = standardQty;
    }

    writeFile(CART_FILE, carts);
    res.json(userCart.items);
  } catch (error) {
    res.status(500).json({ error: 'Shopping cart tracking mathematical computation failure.' });
  }
});

router.delete('/', authenticate, (req, res) => {
  try {
    const { productId, selectedColor, selectedSize } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product criteria required.' });

    let carts = fetchAllCarts();
    const userCart = carts.find(c => String(c.userId) === String(req.user.id));
    if (!userCart) return res.status(404).json({ error: 'Entity collection unallocated.' });

    userCart.items = userCart.items.filter(i => 
      !(String(i.productId) === String(productId) && 
        String(i.selectedColor) === String(selectedColor || '—') && 
        String(i.selectedSize) === String(selectedSize || '—'))
    );

    writeFile(CART_FILE, carts);
    res.json(userCart.items);
  } catch (error) {
    res.status(500).json({ error: 'Removal execution parameters exception.' });
  }
});

router.delete('/clear', authenticate, (req, res) => {
  try {
    let carts = fetchAllCarts();
    const userCart = carts.find(c => String(c.userId) === String(req.user.id));
    if (userCart) {
      userCart.items = [];
      writeFile(CART_FILE, carts);
    }
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Flush database operational anomalies encountered.' });
  }
});

module.exports = router;