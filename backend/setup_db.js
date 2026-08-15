const { Client } = require('pg');
async function setup() {
  const client1 = new Client({ user: 'postgres', password: 'postgres', host: 'localhost', port: 5432, database: 'postgres' });
  await client1.connect();
  try {
    await client1.query('CREATE DATABASE college_events_db;');
    console.log('Database college_events_db created successfully.');
  } catch (e) {
    console.log('Database already exists or error:', e.message);
  }
  await client1.end();

  const client2 = new Client({ user: 'postgres', password: 'postgres', host: 'localhost', port: 5432, database: 'college_events_db' });
  await client2.connect();
  try {
    await client2.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Extension pgvector created successfully.');
  } catch (e) {
    console.log('Failed to create extension:', e.message);
  }
  await client2.end();
}
setup();
