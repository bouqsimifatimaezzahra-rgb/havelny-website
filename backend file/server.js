require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5000;

// Universal Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🔍 DEBUGGER LOG: Look at your computer terminal when you click a button on your phone!
// This will print out exactly what your phone is asking for.
app.use((req, res, next) => {
  console.log(`📱 Phone requested URL: ${req.method} ${req.url}`);
  next();
});

// Route for backend uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import API Endpoints safely
try {
  app.use('/api/products', require('./routes/products'));
  app.use('/api/users', require('./routes/users'));
  app.use('/api/orders', require('./routes/orders'));
  app.use('/api/cart', require('./routes/cart'));
  app.use('/api/messages', require('./routes/messages'));
} catch (err) {
  console.log("⚠️ Note: Some API routes were skipped or not found yet.");
}

// 🛠️ FAIL-SAFE STATIC FILE SERVER
// This middleware checks BOTH your 'public' folder and your 'root' folder for the HTML file.
app.use((req, res, next) => {
  // If it's an API request, skip this file finder
  if (req.url.startsWith('/api')) return next();

  let originalUrl = req.url === '/' ? '/index.html' : req.url;
  // If the path doesn't end in .html, try adding it
  if (!originalUrl.includes('.')) {
    originalUrl += '.html';
  }

  // Define potential file targets
  const publicPath = path.join(__dirname, 'public', originalUrl);
  const rootPath = path.join(__dirname, originalUrl);

  // Check public/ folder first
  if (fs.existsSync(publicPath) && fs.lstatSync(publicPath).isFile()) {
    return res.sendFile(publicPath);
  }
  // Check root project folder second
  if (fs.existsSync(rootPath) && fs.lstatSync(rootPath).isFile()) {
    return res.sendFile(rootPath);
  }

  next();
});

// 🚨 ANTI-BLANK PAGE EMERGENCY ROUTE
// If the server reaches this point, the file doesn't exist anywhere.
// Instead of a blank page, it displays this helpful dashboard on your phone.
app.use((req, res) => {
  if (req.url.startsWith('/api')) {
    return res.status(404).json({ error: `API Route ${req.url} not found` });
  }

  res.status(404).send(`
    <div style="font-family: sans-serif; padding: 20px; text-align: center; background: #fff5f5; color: #c62828; border: 2px dashed #c62828; margin: 20px; border-radius: 10px;">
      <h2>⚠️ Page Connection Error</h2>
      <p>Your phone successfully reached your server, but the file you requested could not be found.</p>
      <div style="background: #333; color: #fff; padding: 10px; border-radius: 5px; text-align: left; font-family: monospace; display: inline-block;">
        Requested Path: ${req.url}
      </div>
      <p style="color: #555; margin-top: 15px;"><strong>How to fix:</strong> Make sure a file named like the path above exists inside your <code>public/</code> folder or your main project folder.</p>
      <a href="/" style="display: inline-block; margin-top: 15px; background: #c17a5e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Go Back Home</a>
    </div>
  `);
});

app.listen(PORT, () => {
  console.log(`\n🚀 ===================================================`);
  console.log(`🛋️  Havenly Server is running perfectly!`);
  console.log(`💻 On your computer: http://localhost:${PORT}`);
  console.log(`======================================================\n`);
  console.log(`👇 WATCH BELOW: Phone requests will print here in real-time:`);
});
const PORT = process.env.PORT || 5000;