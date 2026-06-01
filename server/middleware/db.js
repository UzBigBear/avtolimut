const fs = require('fs');
const path = require('path');

// On Vercel the filesystem is read-only; writable area is /tmp only.
// We copy the bundled JSON files to /tmp on first access.
const IS_VERCEL = process.env.VERCEL === '1';
const SOURCE_PATH = path.join(__dirname, '../database');
const RUNTIME_PATH = IS_VERCEL ? '/tmp/uzavto-db' : SOURCE_PATH;

const FILES = ['users.json', 'queue.json', 'cars.json'];

let initialized = false;

const init = () => {
  if (!IS_VERCEL || initialized) return;
  if (!fs.existsSync(RUNTIME_PATH)) {
    fs.mkdirSync(RUNTIME_PATH, { recursive: true });
  }
  FILES.forEach(file => {
    const dest = path.join(RUNTIME_PATH, file);
    if (!fs.existsSync(dest)) {
      const src = path.join(SOURCE_PATH, file);
      if (fs.existsSync(src)) {
        fs.copyFileSync(src, dest);
      } else {
        // Write empty array if source doesn't exist
        fs.writeFileSync(dest, '[]', 'utf-8');
      }
    }
  });
  initialized = true;
};

/**
 * Read a JSON database file
 * @param {string} filename - e.g. 'users.json'
 * @returns {Array}
 */
const readDB = (filename) => {
  init();
  try {
    const filePath = path.join(RUNTIME_PATH, filename);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

/**
 * Write data to a JSON database file
 * @param {string} filename - e.g. 'users.json'
 * @param {Array} data
 */
const writeDB = (filename, data) => {
  init();
  const filePath = path.join(RUNTIME_PATH, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

module.exports = { readDB, writeDB };
