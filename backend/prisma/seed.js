const prisma = require('../src/db');
const { faker } = require('@faker-js/faker');
const bcrypt = require('bcrypt');

async function main() {
  console.log('Clearing database...');
  await prisma.knowledgeDocument.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.studentBehavior.deleteMany();
  await prisma.eventPrediction.deleteMany();
  await prisma.aIEventGeneration.deleteMany();
  await prisma.chatHistory.deleteMany();
  await prisma.recommendation.deleteMany();
  await prisma.eventInteraction.deleteMany();
  await prisma.feedback.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.studentProfile.deleteMany();
  await prisma.organizerProfile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding database...');
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      name: 'Dean Arthur Vance',
      email: 'admin@university.edu',
      password,
      role: 'ADMIN'
    }
  });

  // 2. Create 20 Organizers
  const organizers = [];
  const departments = ['Computer Science', 'Business', 'Arts', 'Engineering', 'Science'];
  for (let i = 1; i <= 20; i++) {
    const org = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: `organizer${i}@university.edu`,
        password,
        role: 'ORGANIZER',
        organizerProfile: {
          create: {
            department: faker.helpers.arrayElement(departments),
            organizationName: `${faker.word.adjective()} Club`
          }
        }
      }
    });
    organizers.push(org);
  }

  // 3. Create 300 Students
  const students = [];
  const skillsList = ['React', 'Python', 'Leadership', 'Design', 'Marketing', 'AI', 'Public Speaking'];
  const interestsList = ['Technology', 'Sports', 'Arts', 'Business', 'Music', 'Networking'];
  
  for (let i = 1; i <= 300; i++) {
    const stud = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: `student${i}@university.edu`,
        password,
        role: 'STUDENT',
        studentProfile: {
          create: {
            department: faker.helpers.arrayElement(departments),
            year: faker.number.int({ min: 1, max: 4 }),
            interests: faker.helpers.arrayElements(interestsList, 3),
            skills: faker.helpers.arrayElements(skillsList, 3)
          }
        }
      }
    });
    students.push(stud);
  }

  // 4. Create 50 Events
  const events = [];
  const categories = ['Technology', 'Workshop', 'Seminar', 'Cultural', 'Sports', 'Hackathon'];
  const statuses = ['PUBLISHED', 'COMPLETED', 'PUBLISHED', 'COMPLETED'];
  
  for (let i = 1; i <= 50; i++) {
    const ev = await prisma.event.create({
      data: {
        title: faker.company.catchPhrase(),
        description: faker.lorem.paragraph(),
        category: faker.helpers.arrayElement(categories),
        organizerId: faker.helpers.arrayElement(organizers).id,
        venue: `Room ${faker.number.int({ min: 100, max: 500 })}`,
        eventDate: faker.date.between({ from: '2025-01-01', to: '2026-12-31' }),
        startTime: '10:00',
        endTime: '12:00',
        capacity: faker.number.int({ min: 30, max: 200 }),
        targetAudience: 'All Students',
        status: faker.helpers.arrayElement(statuses)
      }
    });
    events.push(ev);
  }

  // 5. Create Registrations, Attendances, Feedbacks
  let regCount = 0;
  const registrationsData = [];
  const interactionsData = [];
  const attendancesData = [];
  const feedbacksData = [];

  for (const ev of events) {
    const numRegs = Math.floor(Math.random() * Math.min(ev.capacity, 100)); // up to 100 regs per event
    const registeredStudents = faker.helpers.arrayElements(students, numRegs);
    
    for (const stud of registeredStudents) {
      registrationsData.push({
        studentId: stud.id,
        eventId: ev.id,
        status: 'REGISTERED'
      });
      regCount++;

      interactionsData.push({
        studentId: stud.id,
        eventId: ev.id,
        interactionType: 'REGISTER'
      });

      if (ev.status === 'COMPLETED') {
        const attended = Math.random() > 0.2; // 80% attendance
        if (attended) {
          attendancesData.push({ studentId: stud.id, eventId: ev.id, status: 'PRESENT' });
          
          const rating = faker.number.int({ min: 3, max: 5 });
          feedbacksData.push({
            studentId: stud.id,
            eventId: ev.id,
            rating,
            comment: faker.lorem.sentence(),
            sentiment: rating >= 4 ? 'POSITIVE' : 'NEUTRAL',
            sentimentScore: rating / 5,
            topics: ['General']
          });
        } else {
          attendancesData.push({ studentId: stud.id, eventId: ev.id, status: 'ABSENT' });
        }
      }
    }
  }

  console.log(`Bulk inserting ${regCount} registrations and related data...`);
  await prisma.registration.createMany({ data: registrationsData });
  await prisma.eventInteraction.createMany({ data: interactionsData });
  await prisma.attendance.createMany({ data: attendancesData });
  await prisma.feedback.createMany({ data: feedbacksData });

  console.log(`Seeding complete. Created ${regCount} registrations.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
