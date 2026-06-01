import initSqlJs from 'sql.js';
import fs from 'fs';
import crypto from 'crypto';

const db = new (await initSqlJs()).Database(fs.readFileSync('./data/autoeffortless.db'));

const result = db.exec('SELECT id, email, name, role, password FROM users');
console.log('Users in DB:');
for (const row of result[0].values) {
  const user = {};
  result[0].columns.forEach((c,i) => user[c] = row[i]);
  const hash = crypto.createHash('sha256').update('admin123').digest('hex');
  console.log(`  ${user.email} (${user.role}) | password match: ${user.password === hash}`);
  console.log(`    hash: ${user.password}`);
  console.log(`    expected: ${hash}`);
}
