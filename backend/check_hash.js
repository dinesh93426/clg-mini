const bcrypt = require('bcrypt');
async function main() {
  const hash = '$2b$10$8GJPGK11txjIK3/fNwIApuKbGlQNYkqpJ9iNj3i/xRcoK2Bp2U1Te';
  const isValid = await bcrypt.compare('password123', hash);
  console.log("Is 'password123' valid?", isValid);
}
main();
