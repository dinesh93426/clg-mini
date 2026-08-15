const { Client } = require('pg');
const passwords = ['postgres', 'admin', 'root', 'password', '1234', ''];
async function test() {
  for (const p of passwords) {
    const client = new Client({ user: 'postgres', password: p, host: 'localhost', port: 5432, database: 'postgres' });
    try {
      await client.connect();
      console.log('SUCCESS:', p === '' ? 'EMPTY' : p);
      process.exit(0);
    } catch (e) {
      console.log('FAILED:', p === '' ? 'EMPTY' : p);
    }
  }
  console.log('ALL FAILED');
}
test();
