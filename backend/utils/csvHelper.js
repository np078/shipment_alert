const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');

const DATA_DIR = path.join(__dirname, '../../data');

function readCSV(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) return [];
  const content = fs.readFileSync(filePath, 'utf8');
  return parse(content, { columns: true, skip_empty_lines: true, trim: true });
}

function writeCSV(filename, records, columns) {
  const filePath = path.join(DATA_DIR, filename);
  const content = stringify(records, { header: true, columns });
  fs.writeFileSync(filePath, content, 'utf8');
}

module.exports = { readCSV, writeCSV };
