const prisma = require('./src/db');
const bcrypt = require('bcrypt');

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const email = 'organizer@snsct.org';
  const name = 'Organizer';
  const department = 'General';

  console.log(`Inserting organizer: ${email}`);
  
  await prisma.organizer.upsert({
    where: { email },
    update: {
      password: hashedPassword
    },
    create: {
      name,
      email,
      password: hashedPassword,
      department
    }
  });
  
  console.log('Organizer import completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
