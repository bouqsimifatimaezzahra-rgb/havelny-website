const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]));
    return [];
  }
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data || '[]');
  } catch (error) {
    console.error(`Error processing file ${filename}, parsing failure reset:`, error);
    return [];
  }
}

function writeFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

function getNextId(filename) {
  const items = readFile(filename);
  if (items.length === 0) return 1;
  const numericalIds = items.map(item => parseInt(item.id)).filter(id => !isNaN(id));
  return numericalIds.length === 0 ? 1 : Math.max(...numericalIds) + 1;
}

module.exports = { readFile, writeFile, getNextId };