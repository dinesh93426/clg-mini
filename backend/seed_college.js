const prisma = require('./src/db');

async function main() {
  console.log('Seeding default college...');

  let centralCollege = await prisma.college.findUnique({ where: { name: 'Central College' } });
  
  if (!centralCollege) {
    centralCollege = await prisma.college.create({
      data: {
        name: 'Central College',
        domain: 'central.edu'
      }
    });
    console.log('Created Central College:', centralCollege.id);
  } else {
    console.log('Central College already exists:', centralCollege.id);
  }

  const { count: adminCount } = await prisma.admin.updateMany({
    where: { collegeId: null },
    data: { collegeId: centralCollege.id }
  });
  console.log(`Updated ${adminCount} admins to Central College.`);

  const { count: orgCount } = await prisma.organizer.updateMany({
    where: { collegeId: null },
    data: { collegeId: centralCollege.id }
  });
  console.log(`Updated ${orgCount} organizers to Central College.`);

  const { count: eventCount } = await prisma.event.updateMany({
    where: { collegeId: null },
    data: { collegeId: centralCollege.id }
  });
  console.log(`Updated ${eventCount} events to Central College.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
