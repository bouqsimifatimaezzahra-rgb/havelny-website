const express = require('express');
const bcrypt = require('bcryptjs');
const { readFile, writeFile, getNextId } = require('../utils/fileStorage');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();
const USERS_FILE = 'users.json';

// Registration
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: 'Username, email, and password registration metrics required.' });
    }

    const users = readFile(USERS_FILE);

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase().trim())) {
      return res.status(400).json({ error: 'Account username registration handle already taken.' });
    }
    if (users.find(u => u.email.toLowerCase() === email.toLowerCase().trim())) {
      return res.status(400).json({ error: 'Email registry destination already connected to another user.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: getNextId(USERS_FILE),
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      name: name || username.trim(),
      role: 'user', // Change locally within users.json file to 'manager' to open administrative features
      created: new Date().toISOString()
    };

    users.push(newUser);
    writeFile(USERS_FILE, users);

    const { password: _, ...userWithoutPassword } = newUser;
    const token = generateToken(newUser);

    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Account Registration Fault:', error);
    res.status(500).json({ error: 'Internal pipeline failure processing registry.' });
  }
});

// Authentication Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Verification credentials incomplete.' });
    }

    const users = readFile(USERS_FILE);
    const user = users.find(u => 
      u.username.toLowerCase() === username.toLowerCase().trim() || 
      u.email.toLowerCase() === username.toLowerCase().trim()
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid identification credentials.' });
    }

    const matchingSignatures = await bcrypt.compare(password, user.password);
    if (!matchingSignatures) {
      return res.status(401).json({ error: 'Invalid identification credentials.' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = generateToken(user);

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    res.status(500).json({ error: 'Internal system interface login failure.' });
  }
});

// Self Profile Resolution Loop
router.get('/me', authenticate, (req, res) => {
  const users = readFile(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) {
    return res.status(404).json({ error: 'Account registry not resolved.' });
  }
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

module.exports = router;