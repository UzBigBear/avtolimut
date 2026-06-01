const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database');

/**
 * Read a JSON database file
 * @param {string} filename - e.g. 'users.json'
 * @returns {Array}
 */
const readDB = (filename) => {
  try {
    const filePath = path.join(DB_PATH, filename);
    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    return [];
  }
};

/**
 * Write data to a JSON database file
 * @param {string} filename - e.g. 'users.json'
 * @param {Array} data
 */
const writeDB = (filename, data) => {
  const filePath = path.join(DB_PATH, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

module.exports = { readDB, writeDB };
