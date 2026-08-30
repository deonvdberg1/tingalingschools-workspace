// Investigate: deonvdberg1's account state + Ting-A-Ling directory + who has client_id 6
const init = require('sql.js');
const fs = require('fs');
(async () => {
  const SQL = await init();
  const db = new SQL.Database(fs.readFileSync('/Users/deonvandenberg/.openclaw/workspace/fred/dashboard-api/data/autoeffortless.db'));

  const users = db.exec("SELECT id, email, role, client_id, name FROM users WHERE email LIKE '%deonvdberg1%' OR email LIKE '%tingaling%' OR email LIKE '%tingalingpreprimary%' ORDER BY id");
  console.log('== USERS ==');
  (users[0]?.values || []).forEach((r) => console.log(r.join(' | ')));

  const dir = db.exec('SELECT id, owner_email, name, email, role, active, user_id FROM staff_directory ORDER BY id');
  console.log('== STAFF DIRECTORY ==');
  (dir[0]?.values || []).forEach((r) => console.log(r.join(' | ')));

  const grants = db.exec('SELECT sd.id, sd.name, sda.product_key, sda.enabled FROM staff_directory_apps sda JOIN staff_directory sd ON sd.id = sda.staff_id ORDER BY sd.id');
  console.log('== DIRECTORY APP GRANTS ==');
  (grants[0]?.values || []).forEach((r) => console.log(r.join(' | ')));

  const cp = db.exec('SELECT id, client_id, product_key, product_name FROM client_products ORDER BY id');
  console.log('== CLIENT PRODUCTS ==');
  (cp[0]?.values || []).forEach((r) => console.log(r.join(' | ')));

  const pu = db.exec("SELECT email, product_key, status FROM purchases ORDER BY id");
  console.log('== PURCHASES ==');
  (pu[0]?.values || []).forEach((r) => console.log(r.join(' | ')));
})();
