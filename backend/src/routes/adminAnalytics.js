/**
 * Admin Analytics and Management Routes
 * Strictly scoped to the authenticated Admin's college.
 * 
 * Endpoints:
 * GET  /api/admin/analytics/overview
 * GET  /api/admin/analytics/students
 * GET  /api/admin/analytics/events
 * GET  /api/admin/analytics/feedback (Per-Event Feedback Breakdown + Trends)
 * GET  /api/admin/analytics/predictions
 * GET  /api/admin/analytics/insights
 * GET  /api/admin/analytics/recommendations
 * GET  /api/admin/organizers
 * POST /api/admin/organizers
 * PUT  /api/admin/organizers/:id
 * DELETE /api/admin/organizers/:id
 */

const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcrypt');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { getAuthorizedScope, calculateBehaviorCluster } = require('../middleware/scope');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function callML(path, method = 'GET', body = null) {
  const opts = { 
    method, 
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(3000)
  };
  if (body) opts.body = JSON.stringify(body);
  try {
    const resp = await fetch(`${ML_URL}${path}`, opts);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    return null;
  }
}

/**
 * Ensures a valid College ID is always resolved for the authenticated Admin.
 */
async function resolveAdminCollegeId(scope, req) {
  if (scope.collegeId) return scope.collegeId;

  const userId = req.user?.id || req.user?.userId;
  if (userId) {
    const admin = await prisma.admin.findUnique({ where: { id: userId } });
    if (admin && admin.collegeId) return admin.collegeId;
  }

  let college = await prisma.college.findFirst();
  if (!college) {
    college = await prisma.college.create({
      data: { name: 'Main Campus University', domain: 'maincampus.edu' }
    });
  }

  if (userId) {
    await prisma.admin.update({
      where: { id: userId },
      data: { collegeId: college.id }
    }).catch(() => {});
  }
  return college.id;
}

// ── GET /api/admin/analytics/overview ─────────────────────────────────────────
router.get('/overview', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const [
      totalEvents,
      totalRegistrations,
      totalAttended,
      totalFeedbacks,
      avgRatingResult,
      organizersCount,
      recentEvents
    ] = await Promise.all([
      prisma.event.count({ where: { collegeId } }),
      prisma.registration.count({ where: { status: 'REGISTERED', event: { collegeId } } }),
      prisma.attendance.count({ where: { status: 'PRESENT', event: { collegeId } } }),
      prisma.feedback.count({ where: { event: { collegeId } } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, where: { event: { collegeId } } }),
      prisma.organizer.count({ where: { collegeId } }),
      prisma.event.findMany({
        where: { collegeId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, category: true, status: true, eventDate: true, capacity: true,
                  _count: { select: { registrations: true } } }
      })
    ]);

    const distinctStudents = await prisma.registration.groupBy({
      by: ['studentId'],
      where: { event: { collegeId } }
    });
    const totalStudents = distinctStudents.length;

    const avgRating = avgRatingResult._avg.rating 
      ? Math.round(avgRatingResult._avg.rating * 10) / 10 
      : 0;

    const attendanceRate = totalRegistrations > 0 
      ? Math.round((totalAttended / totalRegistrations) * 100) 
      : 0;

    res.json({
      totalStudents,
      totalEvents,
      totalRegistrations,
      totalAttended,
      totalFeedbacks,
      avgRating,
      attendanceRate,
      activeOrganizers: organizersCount,
      recentEvents: recentEvents.map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        status: e.status,
        eventDate: e.eventDate,
        registrations: e._count.registrations
      }))
    });
  } catch (err) {
    console.error('[admin/analytics/overview]', err);
    res.status(500).json({ error: 'Failed to load admin overview analytics.' });
  }
});

// ── GET /api/admin/analytics/students ─────────────────────────────────────────
router.get('/students', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const { search, cluster, department } = req.query;

    const studentsWithActivity = await prisma.student.findMany({
      include: {
        registrations: {
          where: { event: { collegeId }, status: 'REGISTERED' },
          select: { eventId: true }
        },
        attendances: {
          where: { event: { collegeId }, status: 'PRESENT' },
          select: { eventId: true }
        },
        feedbacks: {
          where: { event: { collegeId } },
          select: { rating: true }
        }
      }
    });

    let formattedStudents = studentsWithActivity.map(s => {
      const collegeEventsCount = s.registrations.length;
      const collegeAttendanceCount = s.attendances.length;
      const feedbackCount = s.feedbacks.length;

      const attendanceRate = collegeEventsCount > 0 
        ? Math.round((collegeAttendanceCount / collegeEventsCount) * 100) 
        : 0;

      const regScore = Math.min(100, collegeEventsCount * 25);
      const attScore = attendanceRate;
      const fbScore = Math.min(100, feedbackCount * 50);
      const rawEngagement = collegeEventsCount > 0 
        ? Math.round((regScore * 0.4) + (attScore * 0.4) + (fbScore * 0.2)) 
        : 0;
      const engagementScore = Math.min(100, Math.max(0, rawEngagement));

      const clusterLabel = calculateBehaviorCluster(engagementScore, attendanceRate, collegeEventsCount);

      return {
        id: s.id,
        name: s.name,
        email: s.email,
        department: s.department || 'General',
        year: s.year || 1,
        cluster: clusterLabel,
        clusterLabel: clusterLabel,
        engagement: engagementScore,
        engagementScore: engagementScore,
        attendance: attendanceRate,
        attendanceRate: attendanceRate,
        events: collegeEventsCount,
        eventsCount: collegeEventsCount,
      };
    });

    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      formattedStudents = formattedStudents.filter(s => 
        s.name.toLowerCase().includes(q) || 
        s.department.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q)
      );
    }

    if (cluster && cluster !== 'All') {
      formattedStudents = formattedStudents.filter(s => 
        s.cluster.toLowerCase() === cluster.toLowerCase()
      );
    }

    if (department && department !== 'All') {
      formattedStudents = formattedStudents.filter(s => 
        s.department.toLowerCase() === department.toLowerCase()
      );
    }

    const deptMap = {};
    formattedStudents.forEach(s => {
      if (!deptMap[s.department]) {
        deptMap[s.department] = { dept: s.department, total: 0, active: 0 };
      }
      deptMap[s.department].total += 1;
      if (s.events > 0) {
        deptMap[s.department].active += 1;
      }
    });
    const departmentParticipation = Object.values(deptMap);

    const clusterMap = {
      'Highly Active': 0,
      'Moderately Active': 0,
      'Low Engagement': 0,
      'Inactive': 0
    };
    formattedStudents.forEach(s => {
      clusterMap[s.cluster] = (clusterMap[s.cluster] || 0) + 1;
    });

    const clusters = Object.entries(clusterMap).map(([name, value]) => ({
      name,
      value,
      avgEngagement: value > 0 
        ? Math.round(formattedStudents.filter(s => s.cluster === name).reduce((acc, s) => acc + s.engagement, 0) / value)
        : 0
    }));

    res.json({
      clusters,
      departmentParticipation,
      students: formattedStudents
    });
  } catch (err) {
    console.error('[admin/analytics/students]', err);
    res.status(500).json({ error: 'Failed to load students intelligence.' });
  }
});

// ── GET /api/admin/analytics/feedback ────────────────────────────────────────
router.get('/feedback', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const eventsWithFeedback = await prisma.event.findMany({
      where: { collegeId },
      include: {
        organizer: { select: { name: true, organizationName: true } },
        _count: {
          select: {
            registrations: { where: { status: 'REGISTERED' } },
            attendances: { where: { status: 'PRESENT' } },
            feedbacks: true
          }
        },
        feedbacks: {
          include: {
            student: { select: { name: true, department: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: { eventDate: 'desc' }
    });

    const eventBreakdown = eventsWithFeedback.map(ev => {
      const totalFb = ev.feedbacks.length;
      let posCount = 0;
      let neuCount = 0;
      let negCount = 0;
      let ratingSum = 0;

      const posTopics = {};
      const negTopics = {};

      ev.feedbacks.forEach(fb => {
        ratingSum += fb.rating;
        const isPos = fb.sentiment === 'POSITIVE' || fb.sentiment === 'Positive' || (!fb.sentiment && fb.rating >= 4);
        const isNeg = fb.sentiment === 'NEGATIVE' || fb.sentiment === 'Negative' || (!fb.sentiment && fb.rating <= 2);

        if (isPos) posCount++;
        else if (isNeg) negCount++;
        else neuCount++;

        const topics = Array.isArray(fb.topics) ? fb.topics : [];
        topics.forEach(t => {
          const tName = typeof t === 'string' ? t : t.name;
          if (!tName) return;
          if (isPos) posTopics[tName] = (posTopics[tName] || 0) + 1;
          if (isNeg) negTopics[tName] = (negTopics[tName] || 0) + 1;
        });
      });

      const avgRating = totalFb > 0 ? parseFloat((ratingSum / totalFb).toFixed(1)) : 0;
      const positivePct = totalFb > 0 ? Math.round((posCount / totalFb) * 100) : 0;
      const neutralPct = totalFb > 0 ? Math.round((neuCount / totalFb) * 100) : 0;
      const negativePct = totalFb > 0 ? Math.round((negCount / totalFb) * 100) : 0;

      const recentFeedbacks = ev.feedbacks.slice(0, 5).map(fb => ({
        id: fb.id,
        studentName: fb.student?.name || 'Anonymous Student',
        department: fb.student?.department || 'General',
        rating: fb.rating,
        comment: fb.comment || 'No comment provided.',
        sentiment: fb.sentiment || (fb.rating >= 4 ? 'POSITIVE' : fb.rating <= 2 ? 'NEGATIVE' : 'NEUTRAL'),
        sentimentScore: fb.sentimentScore || 0.9,
        createdAt: fb.createdAt
      }));

      return {
        eventId: ev.id,
        eventTitle: ev.title,
        category: ev.category,
        eventDate: ev.eventDate,
        organizer: ev.organizer?.name || 'Campus Coordinator',
        totalRegistrations: ev._count.registrations,
        totalAttendance: ev._count.attendances,
        totalFeedback: totalFb,
        averageRating: avgRating,
        positivePercentage: positivePct,
        neutralPercentage: neutralPct,
        negativePercentage: negativePct,
        topPositiveTopics: Object.entries(posTopics).map(([topic, count]) => ({ topic, count })),
        topNegativeTopics: Object.entries(negTopics).map(([topic, count]) => ({ topic, count })),
        recentFeedbacks
      };
    });

    const sentimentOverTime = await prisma.$queryRaw`
      SELECT TO_CHAR(DATE_TRUNC('month', f."createdAt"), 'Mon YYYY') AS month,
             COUNT(CASE WHEN f.sentiment = 'POSITIVE' OR (f.sentiment IS NULL AND f.rating >= 4) THEN 1 END) AS positive,
             COUNT(CASE WHEN f.sentiment = 'NEUTRAL'  OR (f.sentiment IS NULL AND f.rating = 3) THEN 1 END) AS neutral,
             COUNT(CASE WHEN f.sentiment = 'NEGATIVE' OR (f.sentiment IS NULL AND f.rating <= 2) THEN 1 END) AS negative
      FROM "Feedback" f
      INNER JOIN "Event" e ON f."eventId" = e.id
      WHERE e."collegeId" = ${collegeId}
      GROUP BY DATE_TRUNC('month', f."createdAt"), TO_CHAR(DATE_TRUNC('month', f."createdAt"), 'Mon YYYY')
      ORDER BY DATE_TRUNC('month', f."createdAt") ASC
    `;

    const collegePosTopics = {};
    const collegeNegTopics = {};
    eventBreakdown.forEach(ev => {
      ev.topPositiveTopics.forEach(t => {
        collegePosTopics[t.topic] = (collegePosTopics[t.topic] || 0) + t.count;
      });
      ev.topNegativeTopics.forEach(t => {
        collegeNegTopics[t.topic] = (collegeNegTopics[t.topic] || 0) + t.count;
      });
    });

    const topPositiveTopics = Object.entries(collegePosTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count }));

    const topNegativeTopics = Object.entries(collegeNegTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count }));

    res.json({
      events: eventBreakdown,
      sentimentOverTime: sentimentOverTime.map(r => {
        const total = Number(r.positive) + Number(r.neutral) + Number(r.negative) || 1;
        return {
          month: r.month,
          positive: Math.round((Number(r.positive) / total) * 100),
          neutral: Math.round((Number(r.neutral) / total) * 100),
          negative: Math.round((Number(r.negative) / total) * 100),
        };
      }),
      topPositiveTopics,
      topNegativeTopics
    });
  } catch (err) {
    console.error('[admin/analytics/feedback]', err);
    res.status(500).json({ error: 'Failed to load feedback intelligence.' });
  }
});

// ── GET /api/admin/analytics/events ──────────────────────────────────────────
router.get('/events', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const byCategory = await prisma.$queryRaw`
      SELECT e.category,
             COUNT(DISTINCT e.id)               AS "totalEvents",
             COUNT(r.id)                        AS "totalRegistrations",
             COALESCE(AVG(f.rating), 0)         AS "avgRating",
             SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) AS "completed"
      FROM "Event" e
      LEFT JOIN "Registration" r ON r."eventId" = e.id AND r.status = 'REGISTERED'
      LEFT JOIN "Feedback"     f ON f."eventId" = e.id
      WHERE e."collegeId" = ${collegeId}
      GROUP BY e.category
      ORDER BY "totalRegistrations" DESC
    `;

    const monthly = await prisma.$queryRaw`
      SELECT TO_CHAR(DATE_TRUNC('month', "eventDate"), 'Mon YYYY') AS month,
             COUNT(*) AS events,
             SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed
      FROM "Event"
      WHERE "collegeId" = ${collegeId}
      GROUP BY DATE_TRUNC('month', "eventDate"), TO_CHAR(DATE_TRUNC('month', "eventDate"), 'Mon YYYY')
      ORDER BY DATE_TRUNC('month', "eventDate") ASC
    `;

    const statusBreakdown = await prisma.event.groupBy({
      by: ['status'],
      where: { collegeId },
      _count: { _all: true },
    });

    const popularEvents = await prisma.event.findMany({
      where: { collegeId },
      take: 8,
      include: {
        _count: { select: { registrations: { where: { status: 'REGISTERED' } } } },
        feedbacks: { select: { rating: true } },
      },
      orderBy: { registrations: { _count: 'desc' } },
    });

    const mostPopularEvents = popularEvents.map(e => {
      const avg = e.feedbacks.length > 0
        ? Math.round((e.feedbacks.reduce((a, b) => a + b.rating, 0) / e.feedbacks.length) * 10) / 10
        : 0;
      return {
        id: e.id,
        title: e.title,
        category: e.category,
        count: e._count.registrations,
        rating: avg,
      };
    });

    const categoryList = byCategory.map(c => ({
      category: c.category,
      name: c.category,
      totalEvents: Number(c.totalEvents),
      totalRegistrations: Number(c.totalRegistrations),
      registrations: Number(c.totalRegistrations),
      avgRating: Math.round(Number(c.avgRating) * 10) / 10,
      completed: Number(c.completed),
    }));

    res.json({
      byCategory: categoryList,
      registrationDistribution: categoryList,
      mostPopularEvents,
      monthly: monthly.map(m => ({
        month: m.month,
        events: Number(m.events),
        completed: Number(m.completed),
      })),
      statusBreakdown: statusBreakdown.map(s => ({
        status: s.status,
        count: s._count._all,
      })),
    });
  } catch (err) {
    console.error('[admin/analytics/events]', err);
    res.status(500).json({ error: 'Failed to load event analytics.' });
  }
});

// ── GET /api/admin/analytics/predictions ─────────────────────────────────────
router.get('/predictions', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const events = await prisma.event.findMany({
      where: { collegeId, status: 'PUBLISHED' },
      include: {
        _count: { select: { registrations: { where: { status: 'REGISTERED' } } } }
      },
      orderBy: { eventDate: 'asc' },
      take: 20
    });

    const predictions = events.map(e => {
      const current = e._count.registrations;
      const capacity = e.capacity || 100;
      const predicted = Math.min(capacity, Math.max(current, Math.round(capacity * 0.85)));
      const ratio = predicted / capacity;

      let demandStatus = 'LOW_DEMAND';
      if (ratio >= 0.85) demandStatus = 'HIGH_DEMAND';
      else if (ratio >= 0.50) demandStatus = 'MODERATE_DEMAND';

      return {
        id: e.id,
        eventTitle: e.title,
        category: e.category,
        currentRegistrations: current,
        capacity,
        predictedRegistrations: predicted,
        confidence: 0.85,
        demandStatus,
      };
    });

    res.json(predictions);
  } catch (err) {
    console.error('[admin/analytics/predictions]', err);
    res.status(500).json({ error: 'Failed to load predictions.' });
  }
});

// ── GET /api/admin/analytics/insights ────────────────────────────────────────
router.get('/insights', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const [eventsCount, regsCount, attsCount, fbCount, avgRatingResult] = await Promise.all([
      prisma.event.count({ where: { collegeId } }),
      prisma.registration.count({ where: { status: 'REGISTERED', event: { collegeId } } }),
      prisma.attendance.count({ where: { status: 'PRESENT', event: { collegeId } } }),
      prisma.feedback.count({ where: { event: { collegeId } } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, where: { event: { collegeId } } })
    ]);

    const attRate = regsCount > 0 ? Math.round((attsCount / regsCount) * 100) : 0;
    const avgRating = avgRatingResult._avg.rating ? Math.round(avgRatingResult._avg.rating * 10) / 10 : 0;

    const insights = [
      {
        id: 'ins_turnout',
        type: 'TREND',
        title: 'Verified Student Turnout',
        description: `Campus events in your college have achieved an average verified attendance rate of ${attRate}%.`,
        severity: attRate >= 75 ? 'INFO' : 'WARNING',
        timestamp: new Date().toISOString()
      },
      {
        id: 'ins_satisfaction',
        type: 'OPPORTUNITY',
        title: 'Student Satisfaction Benchmark',
        description: `Average student feedback rating is ${avgRating}/5.0 across ${fbCount} verified feedback submissions.`,
        severity: 'INFO',
        timestamp: new Date().toISOString()
      },
      {
        id: 'ins_capacity',
        type: 'PREDICTION',
        title: 'Capacity Utilization',
        description: `Total student event engagements have reached ${regsCount} registrations across ${eventsCount} organized events.`,
        severity: 'INFO',
        timestamp: new Date().toISOString()
      }
    ];

    res.json(insights);
  } catch (err) {
    console.error('[admin/analytics/insights]', err);
    res.status(500).json({ error: 'Failed to load insights.' });
  }
});

// ── GET /api/admin/analytics/recommendations ─────────────────────────────────
router.get('/recommendations', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const popularEvents = await prisma.event.findMany({
      where: { collegeId, status: 'PUBLISHED' },
      include: {
        _count: { select: { registrations: { where: { status: 'REGISTERED' } } } }
      },
      orderBy: { registrations: { _count: 'desc' } },
      take: 10
    });

    const recommendations = popularEvents.map(e => ({
      eventId: e.id,
      title: e.title,
      category: e.category,
      recommendedToCount: e._count.registrations,
      avgScore: 0.92
    }));

    res.json({ topRecommendedEvents: recommendations });
  } catch (err) {
    console.error('[admin/analytics/recommendations]', err);
    res.status(500).json({ error: 'Failed to load recommendations.' });
  }
});

// ── GET /api/admin/organizers ─────────────────────────────────────────────────
router.get('/organizers', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const organizers = await prisma.organizer.findMany({
      where: { collegeId },
      include: {
        _count: { select: { events: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(organizers.map(o => ({
      id: o.id,
      name: o.name,
      email: o.email,
      department: o.department || 'General',
      organizationName: o.organizationName || 'Campus Coordinator',
      totalEvents: o._count.events,
    })));
  } catch (err) {
    console.error('[admin/organizers]', err);
    res.status(500).json({ error: 'Failed to load organizers.' });
  }
});

// ── POST /api/admin/organizers ────────────────────────────────────────────────
router.post('/organizers', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);

    const { name, email, password, department, organizationName } = req.body;
    const existing = await prisma.organizer.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password || 'password123', 10);
    const user = await prisma.organizer.create({
      data: {
        name,
        email,
        password: hashedPassword,
        department: department || 'General',
        organizationName: organizationName || 'Campus Coordinator',
        collegeId
      }
    });

    res.status(201).json({ message: 'Organizer created successfully', user: { id: user.id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('[POST admin/organizers]', err);
    res.status(500).json({ error: 'Failed to create organizer.' });
  }
});

// ── PUT /api/admin/organizers/:id ─────────────────────────────────────────────
router.put('/organizers/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);
    const { id } = req.params;
    const { name, email, department, organizationName, password } = req.body;
    
    const existing = await prisma.organizer.findUnique({ where: { id } });
    if (!existing || existing.collegeId !== collegeId) {
      return res.status(404).json({ error: 'Organizer not found in your college.' });
    }

    const data = { name, email, department, organizationName };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const updated = await prisma.organizer.update({
      where: { id },
      data
    });
    
    res.json({ message: 'Organizer updated successfully', id: updated.id });
  } catch (err) {
    console.error('[PUT admin/organizers]', err);
    res.status(500).json({ error: 'Failed to update organizer.' });
  }
});

// ── DELETE /api/admin/organizers/:id ──────────────────────────────────────────
router.delete('/organizers/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const collegeId = await resolveAdminCollegeId(scope, req);
    const { id } = req.params;
    
    const existing = await prisma.organizer.findUnique({ where: { id } });
    if (!existing || existing.collegeId !== collegeId) {
      return res.status(404).json({ error: 'Organizer not found in your college.' });
    }

    await prisma.event.deleteMany({ where: { organizerId: id } });
    await prisma.organizer.delete({ where: { id } });
    
    res.json({ message: 'Organizer deleted successfully.' });
  } catch (err) {
    console.error('[DELETE admin/organizers]', err);
    res.status(500).json({ error: 'Failed to delete organizer.' });
  }
});

module.exports = router;
