const prisma = require('./src/db');
const bcrypt = require('bcrypt');

const rawData = `1
GOKULAKRISHNAN R
[gokulakrishnan.r.cse.2024@snsct.org](mailto:gokulakrishnan.r.cse.2024@snsct.org)
CSE
2024
Python, SQL, Git
AI, Data Science
2
AABITHA ANAFA A
[aabitha.a.cse.2024@snsct.org](mailto:aabitha.a.cse.2024@snsct.org)
CSE
2024
Java, HTML, CSS
Web Development, UI/UX
3
AAKASH A
[aakash.a.cse.2024@snsct.org](mailto:aakash.a.cse.2024@snsct.org)
CSE
2024
Python, DSA, C++
AI, Competitive Programming
4
ABINAYA G
[abinaya.g.cse.2024@snsct.org](mailto:abinaya.g.cse.2024@snsct.org)
CSE
2024
JavaScript, React, SQL
Full Stack Development
5
ACHYUTH V MENON
[achyuth.m.cse.2024@snsct.org](mailto:achyuth.m.cse.2024@snsct.org)
CSE
2024
Python, ML, Pandas
Machine Learning, Data Science
6
ADHITH R
[adhith.r.cse.2024@snsct.org](mailto:adhith.r.cse.2024@snsct.org)
CSE
2024
C++, DSA, Java
Competitive Programming
7
ADHITHYAN S
[adhithyan.s.cse.2024@snsct.org](mailto:adhithyan.s.cse.2024@snsct.org)
CSE
2024
Python, Flask, SQL
Backend Development, AI
8
AKASH MURUGAN N
[akash.n.cse.2024@snsct.org](mailto:akash.n.cse.2024@snsct.org)
CSE
2024
React, Node.js, MongoDB
Full Stack Development
9
ANBUCHEZHIAN I M
[anbuchezhian.m.cse.2024@snsct.org](mailto:anbuchezhian.m.cse.2024@snsct.org)
CSE
2024
Python, TensorFlow, SQL
AI, Deep Learning
10
ANUSHA K
[anusha.k.cse.2024@snsct.org](mailto:anusha.k.cse.2024@snsct.org)
CSE
2024
HTML, CSS, JavaScript
Web Development, UI/UX
11
ANUSUYA S P
[anusuya.p.cse.2024@snsct.org](mailto:anusuya.p.cse.2024@snsct.org)
CSE
2024
Python, Excel, SQL
Data Analytics, AI
12
ARAVIND S
[aravind.s.cse.2024@snsct.org](mailto:aravind.s.cse.2024@snsct.org)
CSE
2024
Java, Spring Boot, SQL
Backend Development
13
ARCHANA A
[archana.a.cse.2024@snsct.org](mailto:archana.a.cse.2024@snsct.org)
CSE
2024
Python, Power BI, SQL
Data Science, Analytics
14
AREEYA A D
[areeya.d.cse.2024@snsct.org](mailto:areeya.d.cse.2024@snsct.org)
CSE
2024
JavaScript, React, Git
Web Development, UI/UX
15
ARVIND S A
[arvind.a.cse.2024@snsct.org](mailto:arvind.a.cse.2024@snsct.org)
CSE
2024
C++, DSA, Python
Competitive Programming, AI
16
ASHVITHA SHREE M
[ashvitha.m.cse.2024@snsct.org](mailto:ashvitha.m.cse.2024@snsct.org)
CSE
2024
Python, ML, Scikit-learn
Machine Learning, Research
17
ASWIN B S
[aswin.s.cse.2024@snsct.org](mailto:aswin.s.cse.2024@snsct.org)
CSE
2024
Java, SQL, Git
Cloud Computing, Backend
18
ATCHAYASRI M
[atchayasri.m.cse.2024@snsct.org](mailto:atchayasri.m.cse.2024@snsct.org)
CSE
2024
HTML, CSS, React
UI/UX, Web Development
19
ATHEESH S R
[atheesh.r.cse.2024@snsct.org](mailto:atheesh.r.cse.2024@snsct.org)
CSE
2024
Python, OpenCV, C++
Computer Vision, AI
20
BALA K
[bala.k.cse.2024@snsct.org](mailto:bala.k.cse.2024@snsct.org)
CSE
2024
Java, DSA, SQL
Software Development
21
BALA VIJAYA DILIPPAN A
[bala.a.cse.2024@snsct.org](mailto:bala.a.cse.2024@snsct.org)
CSE
2024
Python, IoT, Arduino
IoT, Robotics
22
BARATH KRISHNA R V
[barath.v.cse.2024@snsct.org](mailto:barath.v.cse.2024@snsct.org)
CSE
2024
React, Node.js, PostgreSQL
Full Stack Development
23
BHARATHAN K
[bharathan.k.cse.2024@snsct.org](mailto:bharathan.k.cse.2024@snsct.org)
CSE
2024
C++, DSA, Java
Competitive Programming
24
BHUVENESH K K
[bhuvenesh.k.cse.2024@snsct.org](mailto:bhuvenesh.k.cse.2024@snsct.org)
CSE
2024
Python, Django, SQL
Backend Development, Cloud
25
BOOPATHI C
[boopathi.c.cse.2024@snsct.org](mailto:boopathi.c.cse.2024@snsct.org)
CSE
2024
JavaScript, React, Git
Web Development
26
BOOPATHIRAJ D
[boopathiraj.d.cse.2024@snsct.org](mailto:boopathiraj.d.cse.2024@snsct.org)
CSE
2024
Python, Flask, PostgreSQL
Backend Development, AI
27
BRINDHA G
[brindha.g.cse.2024@snsct.org](mailto:brindha.g.cse.2024@snsct.org)
CSE
2024
Python, Pandas, SQL
Data Science, Analytics
28
DANUJA V
[danuja.v.cse.2024@snsct.org](mailto:danuja.v.cse.2024@snsct.org)
CSE
2024
Java, HTML, CSS
App Development, Web Development
29
DEEPISHA K R
[deepisha.r.cse.2024@snsct.org](mailto:deepisha.r.cse.2024@snsct.org)
CSE
2024
Python, TensorFlow, Keras
Deep Learning, AI
30
DEVA PRIYA V
[devapriya.v.cse.2024@snsct.org](mailto:devapriya.v.cse.2024@snsct.org)
CSE
2024
React, JavaScript, Figma
UI/UX, Frontend Development
31
DHANUSH P
[dhanush.p.cse.2024@snsct.org](mailto:dhanush.p.cse.2024@snsct.org)
CSE
2024
C++, DSA, Python
Competitive Programming
32
DHARANI S
[dharani.s.cse.2024@snsct.org](mailto:dharani.s.cse.2024@snsct.org)
CSE
2024
Python, SQL, Power BI
Data Analytics, AI
33
DHARMESHWARAN M
[dharmeshwaran.m.cse.2024@snsct.org](mailto:dharmeshwaran.m.cse.2024@snsct.org)
CSE
2024
Java, Spring Boot, MySQL
Backend Development
34
DHARSHAN G
[dharshan.g.cse.2024@snsct.org](mailto:dharshan.g.cse.2024@snsct.org)
CSE
2024
Python, OpenCV, ML
Computer Vision, AI
35
DHARSHANA B
[dharshana.b.cse.2024@snsct.org](mailto:dharshana.b.cse.2024@snsct.org)
CSE
2024
HTML, CSS, JavaScript
UI/UX, Web Development
36
DHIVYA DHARSHAN V
[dhivyadharshan.v.cse.2024@snsct.org](mailto:dhivyadharshan.v.cse.2024@snsct.org)
CSE
2024
Python, NLP, ML
NLP, Generative AI
37
DHIYANESH KUMAR B
[dhiyanesh.b.cse.2024@snsct.org](mailto:dhiyanesh.b.cse.2024@snsct.org)
CSE
2024
Java, Android, Firebase
App Development
38
DINESH M
[dinesh.m.cse.2024@snsct.org](mailto:dinesh.m.cse.2024@snsct.org)
CSE
2024
Python, React, SQL
AI, Full Stack Development
39
DINESH S
[dinesh.s.cse.2024@snsct.org](mailto:dinesh.s.cse.2024@snsct.org)
CSE
2024
Python, React, Node.js
AI, Web Development
40
DIVYADHARSHNI B
[divyadharshni.b.cse.2024@snsct.org](mailto:divyadharshni.b.cse.2024@snsct.org)
CSE
2024
Python, ML, Pandas
Machine Learning, Data Science
41
FAHAD AL AHAMED M
[fahad.m.cse.2024@snsct.org](mailto:fahad.m.cse.2024@snsct.org)
CSE
2024
Java, SQL, Spring Boot
Cloud Computing, Backend
42
GIRIDHAR S A
[giridhar.a.cse.2024@snsct.org](mailto:giridhar.a.cse.2024@snsct.org)
CSE
2024
Python, DSA, C++
AI, Competitive Programming
43
GNAANESH S A
[gnaanesh.a.cse.2024@snsct.org](mailto:gnaanesh.a.cse.2024@snsct.org)
CSE
2024
React, Node.js, MongoDB
Full Stack Development
44
GOKILAN N
[gokilan.n.cse.2024@snsct.org](mailto:gokilan.n.cse.2024@snsct.org)
CSE
2024
Python, Django, PostgreSQL
Backend Development
45
GUNANAN R
[gunanan.r.cse.2024@snsct.org](mailto:gunanan.r.cse.2024@snsct.org)
CSE
2024
C++, DSA, Java
Competitive Programming
46
GURUSARAN P
[gurusaran.p.cse.2024@snsct.org](mailto:gurusaran.p.cse.2024@snsct.org)
CSE
2024
Python, AWS, Docker
Cloud Computing, DevOps
47
HARI RAGAV S
[hariragav.s.cse.2024@snsct.org](mailto:hariragav.s.cse.2024@snsct.org)
CSE
2024
JavaScript, React, Node.js
Full Stack Development
48
HARIHARAN J
[hariharan.j.cse.2024@snsct.org](mailto:hariharan.j.cse.2024@snsct.org)
CSE
2024
Python, TensorFlow, SQL
AI, Deep Learning
49
HARSHATH M
[harshath.m.cse.2024@snsct.org](mailto:harshath.m.cse.2024@snsct.org)
CSE
2024
Java, Android, Firebase
Mobile App Development
50
HINDUJA V M
[hinduja.m.cse.2024@snsct.org](mailto:hinduja.m.cse.2024@snsct.org)
CSE
2024
Figma, HTML, CSS
UI/UX, Product Design
51
INDHU S V
[indhu.v.cse.2024@snsct.org](mailto:indhu.v.cse.2024@snsct.org)
CSE
2024
Python, SQL, Power BI
Data Science, Analytics
52
JAGADEESWARAN R
[jagadeeswaran.r.cse.2024@snsct.org](mailto:jagadeeswaran.r.cse.2024@snsct.org)
CSE
2024
C++, DSA, Python
AI, Competitive Programming
53
JASHID R
[jashid.r.cse.2024@snsct.org](mailto:jashid.r.cse.2024@snsct.org)
CSE
2024
Java, SQL, Git
Software Development
54
JASHWANT R
[jashwant.r.cse.2024@snsct.org](mailto:jashwant.r.cse.2024@snsct.org)
CSE
2024
Python, Flask, React
Web Development, AI
55
JAYA SURYA R
[jayasurya.r.cse.2024@snsct.org](mailto:jayasurya.r.cse.2024@snsct.org)
CSE
2024
Python, OpenCV, ML
Computer Vision, Robotics
56
JEREMIAH PAUL
[jeremiah.p.cse.2024@snsct.org](mailto:jeremiah.p.cse.2024@snsct.org)
CSE
2024
Java, Spring Boot, SQL
Backend Development, Cloud
57
JESLYN REBEKAH J
[jeslyn.j.cse.2024@snsct.org](mailto:jeslyn.j.cse.2024@snsct.org)
CSE
2024
Python, NLP, SQL
Generative AI, NLP
58
KAMALESH V
[kamalesh.v.cse.2024@snsct.org](mailto:kamalesh.v.cse.2024@snsct.org)
CSE
2024
React, Node.js, PostgreSQL
Full Stack Development
59
KANMANIRAJA V
[kanmaniraja.v.cse.2024@snsct.org](mailto:kanmaniraja.v.cse.2024@snsct.org)
CSE
2024
Python, AWS, Docker
Cloud Computing, DevOps
60
KANNAN A M
[kannan.m.cse.2024@snsct.org](mailto:kannan.m.cse.2024@snsct.org)
CSE
2024
C++, DSA, Java
Competitive Programming
61
KARTHICK RAJA R
[karthick.r.cse.2024@snsct.org](mailto:karthick.r.cse.2024@snsct.org)
CSE
2024
Python, ML, Scikit-learn
Machine Learning, AI
62
KARTHIK K M
[karthik.m.cse.2024@snsct.org](mailto:karthik.m.cse.2024@snsct.org)
CSE
2024
JavaScript, React, Firebase
Web Development, App Development
63
KARTHIK R
[karthik.r.cse.2024@snsct.org](mailto:karthik.r.cse.2024@snsct.org)
CSE
2024
Java, SQL, Spring Boot
Backend Development
64
AKAASH KRISHNA RL
[akaash.l.cse.2024@snsct.org](mailto:akaash.l.cse.2024@snsct.org)
CSE
2024
Python, OpenCV, TensorFlow
Computer Vision, Deep Learning
65
ASHWIN G
[ashwin.g.cse.2024@snsct.org](mailto:ashwin.g.cse.2024@snsct.org)
CSE
2024
Python, Git, Linux
Cybersecurity, Cloud Computing
66
MADHAN V
[madhan.v.cse.2024@snsct.org](mailto:madhan.v.cse.2024@snsct.org)
CSE
2024
React, JavaScript, Node.js
Full Stack Development
67
NAVEENDRA R
[naveendra.r.cse.2024@snsct.org](mailto:naveendra.r.cse.2024@snsct.org)
CSE
2024
Python, SQL, Power BI
Data Analytics, Data Science
68
RAVI VARMA C
[ravivarma.c.cse.2024@snsct.org](mailto:ravivarma.c.cse.2024@snsct.org)
CSE
2024
Java, Android, Firebase
Mobile Development, Cloud`;

async function main() {
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const lines = rawData.trim().split('\n').map(line => line.trim());
  const students = [];
  
  for (let i = 0; i < lines.length; i += 7) {
    const name = lines[i + 1];
    const emailLine = lines[i + 2];
    const emailMatch = emailLine.match(/\[(.*?)\]/);
    const email = emailMatch ? emailMatch[1] : emailLine;
    const department = lines[i + 3];
    const year = parseInt(lines[i + 4], 10);
    const skills = lines[i + 5].split(',').map(s => s.trim());
    const interests = lines[i + 6].split(',').map(s => s.trim());

    students.push({
      name,
      email,
      password: hashedPassword,
      department,
      year,
      skills,
      interests
    });
  }

  console.log(`Parsed ${students.length} students. Inserting...`);
  
  for (const student of students) {
    await prisma.student.upsert({
      where: { email: student.email },
      update: student,
      create: student
    });
  }
  
  console.log('Import completed.');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
