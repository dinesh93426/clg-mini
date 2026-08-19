const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const deptStats = await prisma.$queryRaw`
      SELECT s.department,
             COUNT(DISTINCT s.id)   AS "totalStudents",
             COUNT(DISTINCT r."studentId") AS "activeStudents"
      FROM "Student" s
      LEFT JOIN "Registration" r ON r."studentId" = s.id AND r.status = 'REGISTERED'
      GROUP BY s.department
      ORDER BY "totalStudents" DESC
    `;
    console.log('deptStats success');

    const students = await prisma.student.findMany({
      take: 50,
      orderBy: { engagementScore: 'desc' },
    });
    console.log('students success');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
