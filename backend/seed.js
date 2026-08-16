const prisma = require('./src/db');
const bcrypt = require('bcrypt');

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Student
  await prisma.student.upsert({
    where: { email: 'student@university.edu' },
    update: {},
    create: {
      name: 'Alex Johnson',
      email: 'student@university.edu',
      password: hashedPassword,
      department: 'Computer Science',
      year: 3,
      interests: ['AI', 'Web Dev'],
      skills: ['JavaScript', 'Python']
    }
  });

  // Organizer
  await prisma.organizer.upsert({
    where: { email: 'sarah.organizer@university.edu' },
    update: {},
    create: {
      name: 'Sarah Organizer',
      email: 'sarah.organizer@university.edu',
      password: hashedPassword,
      department: 'Computer Science',
      organizationName: 'CS Tech Club'
    }
  });

  // Admin
  await prisma.admin.upsert({
    where: { email: 'dean.vance@university.edu' },
    update: {},
    create: {
      name: 'Dean Vance',
      email: 'dean.vance@university.edu',
      password: hashedPassword
    }
  });

  console.log('Seed completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
