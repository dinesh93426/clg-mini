const prisma = require('./src/db');
async function main() {
  const allStudents = await prisma.student.findMany();
  console.log("Total students in DB:", allStudents.length);
  const dinesh = allStudents.find(s => s.email.includes('dinesh.s'));
  console.log("Dinesh record:", dinesh);
}
main().finally(() => prisma.$disconnect());
