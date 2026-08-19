const prisma = require('./src/db');
const bcrypt = require('bcrypt');

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const email = 'admin@snsct.org';
  const name = 'Admin';

  console.log(`Inserting admin: ${email}`);
  
  await prisma.admin.upsert({
    where: { email },
    update: {
      password: hashedPassword
    },
    create: {
      name,
      email,
      password: hashedPassword
    }
  });
  
  console.log('Admin import completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
