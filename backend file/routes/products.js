const express = require('express');
const { readFile, writeFile } = require('../utils/fileStorage');
const { authenticate, requireManager } = require('../middleware/auth');
const upload = require('../middleware/upload'); // 🔥 FIX: Import upload middleware

const router = express.Router();
const PRODUCTS_FILE = 'products.json';
const CUSTOM_PRODUCTS_FILE = 'custom_products.json';

function getAllProducts() {
  const base = readFile(PRODUCTS_FILE);
  const custom = readFile(CUSTOM_PRODUCTS_FILE);
  return [...base, ...custom];
}

router.get('/', (req, res) => {
  try {
    res.json(getAllProducts());
  } catch (error) {
    res.status(500).json({ error: 'Internal server reading error' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const products = getAllProducts();
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) return res.status(404).json({ error: 'Product profile unallocated' });
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// 🔥 FIX: Integrated upload.single('img') to accept binary forms along with body parameters
router.post('/', authenticate, requireManager, upload.single('img'), async (req, res) => {
  try {
    const { name, category, price, availableColors, availableSizes, description } = req.body;

    if (!name || !category || !price) {
      return res.status(400).json({ error: 'Name, category, and price criteria missing' });
    }

    const customProducts = readFile(CUSTOM_PRODUCTS_FILE);
    
    // 🔥 FIX: Restructured math block preventing values from compounding (+1000) cyclically
    const nextId = customProducts.length === 0 ? 1001 : Math.max(...customProducts.map(p => p.id)) + 1;

    // Determine path destination url
    let finalImgUrl = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop';
    if (req.file) {
      finalImgUrl = `http://localhost:${process.env.PORT || 5000}/uploads/${req.file.filename}`;
    } else if (req.body.img) {
      finalImgUrl = req.body.img;
    }

    const newProduct = {
      id: nextId,
      name,
      category,
      price: parseFloat(price),
      oldPrice: null,
      rating: 4.5,
      reviews: 0,
      badge: 'new',
      img: finalImgUrl,
      availableColors: availableColors ? (Array.isArray(availableColors) ? availableColors : JSON.parse(availableColors)) : ['Default'],
      availableSizes: availableSizes ? (Array.isArray(availableSizes) ? availableSizes : JSON.parse(availableSizes)) : ['Standard'],
      description: description || '',
      addedBy: req.user.username,
      addedDate: new Date().toISOString()
    };

    customProducts.push(newProduct);
    writeFile(CUSTOM_PRODUCTS_FILE, customProducts);

    res.status(201).json(newProduct);
  } catch (error) {
    console.error('Product Generation Error:', error);
    res.status(500).json({ error: 'Internal system fault recording data' });
  }
});

router.delete('/:id', authenticate, requireManager, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let customProducts = readFile(CUSTOM_PRODUCTS_FILE);
    const index = customProducts.findIndex(p => p.id === id);
    if (index === -1) return res.status(404).json({ error: 'Target product not found' });

    customProducts.splice(index, 1);
    writeFile(CUSTOM_PRODUCTS_FILE, customProducts);
    res.json({ message: 'Catalog entity removed successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server processing fault' });
  }
});

module.exports = router;