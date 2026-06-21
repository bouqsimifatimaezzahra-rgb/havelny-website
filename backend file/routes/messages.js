const express = require('express');
const { readFile, writeFile, getNextId } = require('../utils/fileStorage');
const { authenticate, requireManager } = require('../middleware/auth');

const router = express.Router();
const MESSAGES_FILE = 'messages.json';

router.get('/', authenticate, requireManager, (req, res) => {
  try {
    res.json(readFile(MESSAGES_FILE));
  } catch (error) {
    res.status(500).json({ error: 'Error loading user contact message threads.' });
  }
});

router.post('/', (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: 'Name validation, source email mapping, and payload messages required.' });
    }

    const messages = readFile(MESSAGES_FILE);
    const newMessage = {
      id: getNextId(MESSAGES_FILE),
      name: name.trim(),
      email: email.toLowerCase().trim(),
      message: message.trim(),
      status: 'unread',
      created: new Date().toISOString()
    };

    messages.push(newMessage);
    writeFile(MESSAGES_FILE, messages);

    console.log(`📧 Customer Query Stream: Logged incoming contact alert from ${name}`);
    res.status(201).json({ message: 'Message sent successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to write inbound communications payload trace.' });
  }
});

router.put('/:id/read', authenticate, requireManager, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const messages = readFile(MESSAGES_FILE);
    const msg = messages.find(m => m.id === id);

    if (!msg) return res.status(404).json({ error: 'Target query trace not found.' });

    msg.status = 'read';
    writeFile(MESSAGES_FILE, messages);
    res.json(msg);
  } catch (error) {
    res.status(500).json({ error: 'State modification tracking registry error.' });
  }
});

router.delete('/:id', authenticate, requireManager, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    let messages = readFile(MESSAGES_FILE);
    const index = messages.findIndex(m => m.id === id);

    if (index === -1) return res.status(404).json({ error: 'Target communication trace already deleted or unallocated.' });

    messages.splice(index, 1);
    writeFile(MESSAGES_FILE, messages);
    res.json({ message: 'Communication file entry successfully cleared from system logs.' });
  } catch (error) {
    res.status(500).json({ error: 'Purge context registry action exception.' });
  }
});

module.exports = router;