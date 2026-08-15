// Realistic mock data representing the database for the College Event Intelligence Platform

export const MOCK_USERS = {
  student: {
    id: "stud-01",
    name: "Alex Johnson",
    email: "alex.johnson@university.edu",
    role: "student",
    department: "Computer Science & Engineering",
    year: "3rd Year",
    interests: ["Artificial Intelligence", "Machine Learning", "Software Development", "Hackathons"],
    skills: ["React", "Python", "JavaScript", "SQL"],
    eventPreferences: {
      categories: ["Technology", "AI", "Workshops"],
      timeOfDay: "Afternoon",
      preferredDays: ["Wednesday", "Friday"]
    },
    aiProfile: {
      type: "Highly Active",
      technicalInterest: "High",
      attendanceRate: 87,
      engagementScore: 92,
      preferredCategories: ["AI", "Technology", "Workshops"]
    }
  },
  organizer: {
    id: "org-01",
    name: "Prof. Sarah Carter",
    email: "sarah.carter@university.edu",
    role: "organizer",
    department: "Computer Science Department",
    organization: "IEEE Student Branch & CSE Club"
  },
  admin: {
    id: "adm-01",
    name: "Dean Arthur Vance",
    email: "arthur.vance@university.edu",
    role: "admin",
    department: "Student Affairs"
  }
};

export const MOCK_EVENTS = [
  {
    id: "event-01",
    title: "Generative AI & LLM Workshop",
    description: "Hands-on workshop exploring OpenAI API, Prompt Engineering, and building custom LLM-powered applications. Perfect for beginners to intermediates.",
    category: "AI",
    date: "2026-08-20",
    time: "14:00 - 17:00",
    venue: "Main Auditorium, CSE Block",
    organizer: "IEEE Student Branch",
    totalSeats: 120,
    availableSeats: 12,
    registrationCount: 108,
    image: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 96,
    recommendationReason: "Recommended because you frequently participate in AI and technical workshops.",
    aiRecommended: true,
    tags: ["AI", "Python", "API", "Hands-on"]
  },
  {
    id: "event-02",
    title: "National Smart Campus Hackathon",
    description: "A 36-hour challenge to design, develop, and pitch hardware or software solutions that make campus life smarter, greener, and more efficient.",
    category: "Technology",
    date: "2026-08-28",
    time: "09:00 onwards (36 hrs)",
    venue: "Innovation Lab & Seminar Hall",
    organizer: "CSE Club",
    totalSeats: 150,
    availableSeats: 45,
    registrationCount: 105,
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 92,
    recommendationReason: "High correlation with your interest in Hackathons and React development.",
    aiRecommended: true,
    tags: ["Hackathon", "Coding", "Innovation"]
  },
  {
    id: "event-03",
    title: "React 19 & Next.js Framework Showcase",
    description: "Deep dive into React 19's Server Actions, compiler improvements, and SEO-friendly architectures using modern Next.js paradigms.",
    category: "Technology",
    date: "2026-08-22",
    time: "15:00 - 17:00",
    venue: "CSE Seminar Room 302",
    organizer: "Web Dev Club",
    totalSeats: 80,
    availableSeats: 0,
    registrationCount: 80,
    image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 88,
    recommendationReason: "Matches your React skills and Software Development profile.",
    aiRecommended: true,
    tags: ["React", "Frontend", "NextJS"]
  },
  {
    id: "event-04",
    title: "Campus Business Pitch Championship",
    description: "Present your business ideas to early-stage venture capitalists. Win funding, mentorship, and co-working space opportunities.",
    category: "Business",
    date: "2026-09-02",
    time: "10:00 - 16:00",
    venue: "MBA Block Conference Hall",
    organizer: "E-Cell Foundation",
    totalSeats: 60,
    availableSeats: 22,
    registrationCount: 38,
    image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 42,
    recommendationReason: "Low direct match but popular among top engineering students.",
    aiRecommended: false,
    tags: ["Entrepreneurship", "Pitching", "VC"]
  },
  {
    id: "event-05",
    title: "Indie Rock and Fusion Night",
    description: "Join us for an evening of live music, food stalls, and acoustic performances featuring student bands and local indie artists.",
    category: "Arts",
    date: "2026-08-25",
    time: "18:00 - 21:30",
    venue: "Open Air Theatre (OAT)",
    organizer: "Cultural Committee",
    totalSeats: 500,
    availableSeats: 140,
    registrationCount: 360,
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 65,
    recommendationReason: "Highly popular event on campus with 360 registrations.",
    aiRecommended: false,
    tags: ["Music", "Concert", "Fun"]
  },
  {
    id: "event-06",
    title: "Intro to UI/UX and Figma Workshop",
    description: "Master the art of design. Learn typography, layouts, user flows, and wireframing using Figma with live practice sessions.",
    category: "Arts",
    date: "2026-08-24",
    time: "11:00 - 13:00",
    venue: "Design Lab, Block 4",
    organizer: "Creative Arts Society",
    totalSeats: 50,
    availableSeats: 5,
    registrationCount: 45,
    image: "https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 74,
    recommendationReason: "Complements your frontend skills with UX principles.",
    aiRecommended: true,
    tags: ["UI/UX", "Design", "Figma"]
  },
  {
    id: "event-07",
    title: "Annual Sports Meet Track & Field",
    description: "Registration page for sprinters, high jumpers, and relay teams. Sign up to represent your department in the annual tournament.",
    category: "Sports",
    date: "2026-09-05",
    time: "08:00 - 17:00",
    venue: "University Sports Arena",
    organizer: "Sports Department",
    totalSeats: 250,
    availableSeats: 120,
    registrationCount: 130,
    image: "https://images.unsplash.com/photo-1502014822147-1aedfb0676e0?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 35,
    recommendationReason: "We notice you prefer technical events; this is shown for athletic diversity.",
    aiRecommended: false,
    tags: ["Sports", "Athletics", "Competition"]
  },
  {
    id: "event-08",
    title: "Data Structures & Algorithms Bootcamp",
    description: "Crack the coding interview. Intensive preparation on Graphs, Dynamic Programming, and System Design concepts.",
    category: "Technology",
    date: "2026-09-10",
    time: "14:00 - 18:00",
    venue: "CSE Seminar Room 302",
    organizer: "IEEE Student Branch",
    totalSeats: 100,
    availableSeats: 34,
    registrationCount: 66,
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&q=80&w=600",
    aiMatchPercentage: 91,
    recommendationReason: "Strong fit based on your Python interest and focus on placement prep.",
    aiRecommended: true,
    tags: ["DSA", "Coding Interview", "Python"]
  }
];

export const MOCK_REGISTRATIONS = [
  {
    id: "reg-01",
    eventId: "event-01",
    userId: "stud-01",
    status: "upcoming",
    attendance: null,
    feedbackSubmitted: false,
    registrationDate: "2026-08-10"
  },
  {
    id: "reg-02",
    eventId: "event-03",
    userId: "stud-01",
    status: "completed",
    attendance: true,
    feedbackSubmitted: true,
    feedbackRating: 5,
    feedbackText: "Amazing content! Loved the explanations on React compiler and Server Actions.",
    registrationDate: "2026-08-05"
  },
  {
    id: "reg-03",
    eventId: "event-06",
    userId: "stud-01",
    status: "completed",
    attendance: true,
    feedbackSubmitted: false,
    registrationDate: "2026-08-08"
  },
  {
    id: "reg-04",
    eventId: "event-05",
    userId: "stud-01",
    status: "cancelled",
    attendance: false,
    feedbackSubmitted: false,
    registrationDate: "2026-08-04"
  }
];

export const MOCK_CHAT_HISTORY = [
  {
    id: "chat-01",
    role: "student",
    text: "What technical events are happening this week?",
    timestamp: "2026-08-15T09:30:00Z"
  },
  {
    id: "chat-02",
    role: "ai",
    text: "Based on the current college event database, there are 3 technical/AI events happening this week matching your profile:\n\n1. **Generative AI & LLM Workshop** (August 20, 14:00) at Main Auditorium - A hands-on deep dive. (96% Match)\n2. **React 19 & Next.js Showcase** (August 22, 15:00) at CSE Seminar Room 302 - Recommended for your React skills. (88% Match)\n3. **Intro to UI/UX and Figma Workshop** (August 24, 11:00) at Design Lab - Enhances frontend capabilities. (74% Match)",
    sources: [
      { id: "event-01", title: "Generative AI & LLM Workshop" },
      { id: "event-03", title: "React 19 & Next.js Showcase" },
      { id: "event-06", title: "Intro to UI/UX and Figma Workshop" }
    ],
    timestamp: "2026-08-15T09:30:05Z"
  }
];

export const MOCK_ORGANIZER_ANALYTICS = {
  overview: {
    totalEvents: 6,
    upcomingEvents: 2,
    registrations: 479,
    avgAttendance: 84
  },
  registrationTrend: [
    { date: "Aug 01", count: 45 },
    { date: "Aug 03", count: 88 },
    { date: "Aug 06", count: 140 },
    { date: "Aug 09", count: 210 },
    { date: "Aug 12", count: 320 },
    { date: "Aug 15", count: 479 }
  ],
  attendanceTrend: [
    { eventName: "Python Bootcamp", registered: 90, attended: 82 },
    { eventName: "Data Sci 101", registered: 110, attended: 98 },
    { eventName: "Web Dev Hack", registered: 120, attended: 104 },
    { eventName: "ML Seminar", registered: 80, attended: 55 }
  ],
  categoryDistribution: [
    { name: "AI", value: 35 },
    { name: "Technology", value: 45 },
    { name: "Arts", value: 10 },
    { name: "Business", value: 10 }
  ],
  feedbackSentiment: {
    positive: 74,
    neutral: 18,
    negative: 8
  },
  feedbackTopics: [
    { name: "Speaker Quality", sentiment: "positive", score: 92 },
    { name: "Hands-on Labs", sentiment: "positive", score: 87 },
    { name: "Material Quality", sentiment: "positive", score: 85 },
    { name: "Venue Capacity", sentiment: "negative", score: 62 },
    { name: "Timing & Schedule", sentiment: "neutral", score: 71 }
  ],
  aiEventSummary: {
    text: "Overall event performance was strong across all CSE student surveys. Students highly appreciated the hands-on coding labs and speaker quality. However, venue capacity and minor Wi-Fi drops were the most common points of friction.",
    strengths: [
      "Highly interactive practical sessions using Docker & GitHub Codespaces.",
      "Clear, well-paced delivery from industry speakers.",
      "Post-event resources and GitHub repository access."
    ],
    issues: [
      "Main auditorium overflowed, leaving some students standing.",
      "Wi-Fi connection bottlenecks during concurrent code downloads."
    ],
    improvements: [
      "Limit registrations to actual room seating or request a larger hall.",
      "Mirror dependencies on a local CDN before starting the workshop."
    ]
  }
};

export const MOCK_ADMIN_ANALYTICS = {
  kpis: {
    totalStudents: 1420,
    totalEvents: 42,
    totalRegistrations: 3840,
    attendanceRate: 81.5,
    activeOrganizers: 18,
    changes: {
      students: "+8%",
      events: "+12%",
      registrations: "+24%",
      attendance: "+1.5%",
      organizers: "+2"
    }
  },
  studentEngagement: {
    highlyActive: 580,
    moderatelyActive: 620,
    lowActivity: 220,
    clusters: [
      { name: "Highly Active (CSE/IT)", value: 420 },
      { name: "Moderately Active (ECE/ME)", value: 510 },
      { name: "Low Engagement (Civil/Bio)", value: 290 },
      { name: "Highly Active (Business)", value: 200 }
    ],
    departmentParticipation: [
      { dept: "CSE", active: 480, total: 550 },
      { dept: "ECE", active: 280, total: 400 },
      { dept: "MBA", active: 180, total: 220 },
      { dept: "ME", active: 110, total: 250 }
    ]
  },
  eventIntelligence: {
    mostPopularEvents: [
      { title: "Generative AI Workshop", count: 108, category: "AI", rating: 4.8 },
      { title: "Smart Campus Hackathon", count: 105, category: "Technology", rating: 4.7 },
      { title: "React 19 Showcase", count: 80, category: "Technology", rating: 4.9 },
      { title: "UI/UX Figma Bootcamp", count: 45, category: "Arts", rating: 4.4 }
    ],
    registrationDistribution: [
      { name: "AI", registrations: 1240 },
      { name: "Technology", registrations: 1450 },
      { name: "Arts & Culture", registrations: 620 },
      { name: "Business", registrations: 380 },
      { name: "Sports", registrations: 150 }
    ]
  },
  sentimentIntelligence: {
    distribution: { positive: 76, neutral: 15, negative: 9 },
    sentimentOverTime: [
      { month: "Jan", positive: 65, neutral: 25, negative: 10 },
      { month: "Feb", positive: 70, neutral: 20, negative: 10 },
      { month: "Mar", positive: 72, neutral: 18, negative: 10 },
      { month: "Apr", positive: 78, neutral: 14, negative: 8 },
      { month: "May", positive: 75, neutral: 15, negative: 10 },
      { month: "Jun", positive: 81, neutral: 12, negative: 7 }
    ],
    topPositiveTopics: ["Speaker Delivery", "Technical Depth", "Catering & Snacks", "Q&A Interaction"],
    topNegativeTopics: ["Venue Ventilation", "Timing Conflict with Classes", "Wi-Fi Quality", "Prerequisite Clarity"]
  },
  recommendationMetrics: {
    generated: 8432,
    views: 6120,
    clicks: 1980,
    registrations: 842,
    ratioFromRecommendations: 21.9, // 21.9% of all registrations came from AI suggestions
    performanceTrend: [
      { week: "Wk 1", base: 120, ai: 30 },
      { week: "Wk 2", base: 145, ai: 45 },
      { week: "Wk 3", base: 160, ai: 68 },
      { week: "Wk 4", base: 180, ai: 92 }
    ]
  },
  predictions: [
    {
      id: "pred-01",
      eventTitle: "National Smart Campus Hackathon",
      currentRegistrations: 105,
      capacity: 150,
      predictedRegistrations: 148,
      demandStatus: "HIGH DEMAND",
      confidence: "94% Accuracy"
    },
    {
      id: "pred-02",
      eventTitle: "Data Structures & Algorithms Bootcamp",
      currentRegistrations: 66,
      capacity: 100,
      predictedRegistrations: 112,
      demandStatus: "OVERFLOW RISK",
      confidence: "89% Accuracy"
    },
    {
      id: "pred-03",
      eventTitle: "Campus Business Pitch Championship",
      currentRegistrations: 38,
      capacity: 60,
      predictedRegistrations: 46,
      demandStatus: "NORMAL",
      confidence: "82% Accuracy"
    },
    {
      id: "pred-04",
      eventTitle: "Annual Sports Meet Track & Field",
      currentRegistrations: 130,
      capacity: 250,
      predictedRegistrations: 165,
      demandStatus: "UNDER CAPACITY",
      confidence: "76% Accuracy"
    }
  ],
  aiInsights: [
    {
      id: "insight-01",
      type: "TREND",
      title: "Strong Technical Pull Among CS/IT Students",
      description: "Participation in machine learning and frontend engineering events is 38% higher than overall campus average. Consider organizing specialized developer camps.",
      severity: "success",
      relatedEvent: "Generative AI & LLM Workshop",
      timestamp: "2 hours ago"
    },
    {
      id: "insight-02",
      type: "WARNING",
      title: "DSA Bootcamp Overflow Risk",
      description: "Current registration acceleration indicates demand will hit capacity limit (100) 4 days before the deadline. Action: Request room 402 or create an overflow session.",
      severity: "warning",
      relatedEvent: "Data Structures & Algorithms Bootcamp",
      timestamp: "5 hours ago"
    },
    {
      id: "insight-03",
      type: "OPPORTUNITY",
      title: "High Demand for Weekend Events",
      description: "Data shows that events scheduled on Saturday afternoons score 15% higher attendance rates and generate 20% more feedback forms compared to weekday evening sessions.",
      severity: "info",
      relatedEvent: null,
      timestamp: "1 day ago"
    },
    {
      id: "insight-04",
      type: "PREDICTION",
      title: "Expected Engagement Spike in Arts Portal",
      description: "Upcoming Indie Rock Night has high social sentiment indexes. Anticipated registrations could reach 420+ shortly. Pre-allocate safety crew and parking permits.",
      severity: "warning",
      relatedEvent: "Indie Rock and Fusion Night",
      timestamp: "1 day ago"
    }
  ]
};

export const MOCK_STUDENTS_LIST = [
  { id: "s-01", name: "Alex Johnson", department: "CSE", year: "3rd Year", cluster: "Highly Active", engagement: 92, attendance: 87, events: 4 },
  { id: "s-02", name: "Michael Chen", department: "CSE", year: "4th Year", cluster: "Highly Active", engagement: 95, attendance: 93, events: 7 },
  { id: "s-03", name: "Emily Watson", department: "ECE", year: "2nd Year", cluster: "Moderately Active", engagement: 74, attendance: 80, events: 3 },
  { id: "s-04", name: "David Miller", department: "ME", year: "3rd Year", cluster: "Low Activity", engagement: 42, attendance: 65, events: 1 },
  { id: "s-05", name: "Jessica Taylor", department: "MBA", year: "1st Year", cluster: "Highly Active", engagement: 88, attendance: 90, events: 5 },
  { id: "s-06", name: "Ryan Davies", department: "Civil", year: "4th Year", cluster: "Low Activity", engagement: 31, attendance: 50, events: 0 }
];

export const MOCK_ORGANIZERS_LIST = [
  { id: "o-01", name: "Prof. Sarah Carter", department: "CSE", eventsCount: 12, rating: 4.8, organization: "IEEE Student Branch" },
  { id: "o-02", name: "Dr. James Vance", department: "MBA", eventsCount: 6, rating: 4.5, organization: "E-Cell Foundation" },
  { id: "o-03", name: "Mrs. Clara Higgins", department: "Arts", eventsCount: 14, rating: 4.6, organization: "Cultural Committee" },
  { id: "o-04", name: "Coach Robert Finch", department: "Sports", eventsCount: 8, rating: 4.2, organization: "Sports Department" }
];
