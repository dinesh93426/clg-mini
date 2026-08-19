/**
 * Admin analytics routes
 * GET /api/admin/analytics/overview
 * GET /api/admin/analytics/students
 * GET /api/admin/analytics/events
 * GET /api/admin/analytics/feedback
 * GET /api/admin/analytics/predictions
 * GET /api/admin/analytics/insights
 * GET /api/admin/analytics/recommendations
 * GET /api/admin/organizers
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const bcrypt = require('bcrypt');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function callML(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  try {
    const resp = await fetch(`${ML_URL}${path}`, opts);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.warn(`[adminAnalytics] ML call failed ${path}:`, e.message);
    return null;
  }
}

// ── /api/admin/analytics/overview ────────────────────────────────────────────
router.get('/overview', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const [
      totalStudents,
      totalEvents,
      totalRegistrations,
      totalAttended,
      totalFeedbacks,
      avgRating,
    ] = await Promise.all([
      prisma.student.count(), // Note: We leave student count global or keep as is since students don't have collegeId yet
      prisma.event.count({ where: { collegeId: req.user.collegeId } }),
      prisma.registration.count({ where: { status: 'REGISTERED', event: { collegeId: req.user.collegeId } } }),
      prisma.attendance.count({ where: { status: 'PRESENT', event: { collegeId: req.user.collegeId } } }),
      prisma.feedback.count({ where: { event: { collegeId: req.user.collegeId } } }),
      prisma.feedback.aggregate({ _avg: { rating: true }, where: { event: { collegeId: req.user.collegeId } } }),
    ]);

    const recentEvents = await prisma.event.findMany({
      where: { collegeId: req.user.collegeId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, title: true, category: true, status: true, eventDate: true }
    });

    res.json({
      totalStudents,
      totalEvents,
      totalRegistrations,
      totalAttended,
      totalFeedbacks,
      avgRating: avgRating._avg.rating ? Math.round(avgRating._avg.rating * 10) / 10 : 0,
      attendanceRate: totalRegistrations > 0 ? Math.round(totalAttended / totalRegistrations * 100) : 0,
      recentEvents,
    });
  } catch (err) {
    console.error('[overview]', err);
    res.status(500).json({ error: 'Failed to load overview' });
  }
});

// ── /api/admin/analytics/students ────────────────────────────────────────────
router.get('/students', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    // Cluster distribution from StudentBehavior
    const clusterData = await prisma.studentBehavior.groupBy({
      by: ['clusterLabel'],
      _count: { _all: true },
      _avg: { engagementScore: true },
    });

    const clusters = clusterData.map(c => ({
      name: c.clusterLabel || 'Unclustered',
      value: c._count._all,
      avgEngagement: Math.round((c._avg.engagementScore || 0) * 100) / 100,
    }));

    // Department participation
    const deptStats = await prisma.$queryRaw`
      SELECT s.department,
             COUNT(DISTINCT s.id)   AS "totalStudents",
             COUNT(DISTINCT r."studentId") AS "activeStudents"
      FROM "Student" s
      LEFT JOIN "Registration" r ON r."studentId" = s.id AND r.status = 'REGISTERED'
      GROUP BY s.department
      ORDER BY "totalStudents" DESC
    `;

    const departmentParticipation = deptStats.map(d => ({
      dept: d.department,
      active: Number(d.activeStudents),
      total: Number(d.totalStudents),
    }));

    // Student list with profiles
    const students = await prisma.student.findMany({
      take: 50,
      orderBy: { engagementScore: 'desc' },
    });

    const studentList = students.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      department: s.department,
      year: s.year,
      clusterLabel: s.clusterLabel,
      engagementScore: s.engagementScore,
      attendanceRate: s.attendanceRate,
    }));

    res.json({ clusters, departmentParticipation, students: studentList });
  } catch (err) {
    console.error('[analytics/students]', err);
    res.status(500).json({ error: 'Failed to load student analytics' });
  }
});

// ── /api/admin/analytics/events ──────────────────────────────────────────────
router.get('/events', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    // Events by category
    const byCategory = await prisma.$queryRaw`
      SELECT e.category,
             COUNT(*)                           AS "totalEvents",
             COUNT(r.id)                        AS "totalRegistrations",
             COALESCE(AVG(f.rating), 0)         AS "avgRating",
             SUM(CASE WHEN e.status = 'COMPLETED' THEN 1 ELSE 0 END) AS "completed"
      FROM "Event" e
      LEFT JOIN "Registration" r ON r."eventId" = e.id
      LEFT JOIN "Feedback"     f ON f."eventId" = e.id
      WHERE e."collegeId" = ${req.user.collegeId}
      GROUP BY e.category
      ORDER BY "totalRegistrations" DESC
    `;

    // Monthly event counts
    const monthly = await prisma.$queryRaw`
      SELECT DATE_TRUNC('month', "eventDate") AS month,
             COUNT(*) AS events,
             SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed
      FROM "Event"
      WHERE "eventDate" >= NOW() - INTERVAL '12 months'
        AND "collegeId" = ${req.user.collegeId}
      GROUP BY 1
      ORDER BY 1
    `;

    // Status breakdown
    const statusBreakdown = await prisma.event.groupBy({
      by: ['status'],
      where: { collegeId: req.user.collegeId },
      _count: { _all: true },
    });

    // Most popular events
    const popularEvents = await prisma.event.findMany({
      where: { collegeId: req.user.collegeId },
      take: 8,
      include: {
        _count: { select: { registrations: true } },
        feedbacks: { select: { rating: true } },
      },
      orderBy: { registrations: { _count: 'desc' } },
    });

    const mostPopularEvents = popularEvents.map(e => {
      const avg = e.feedbacks.length > 0
        ? Math.round((e.feedbacks.reduce((a, b) => a + b.rating, 0) / e.feedbacks.length) * 10) / 10
        : 4.5;
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
      registrations: Number(c.totalRegistrations),
      totalEvents: Number(c.totalEvents),
      totalRegistrations: Number(c.totalRegistrations),
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
    console.error('[analytics/events]', err);
    res.status(500).json({ error: 'Failed to load event analytics' });
  }
});

// ── /api/admin/analytics/feedback ────────────────────────────────────────────
router.get('/feedback', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    // Sentiment over time
    const sentimentOverTime = await prisma.$queryRaw`
      SELECT TO_CHAR(DATE_TRUNC('month', f."createdAt"), 'Mon YYYY') AS month,
             COUNT(CASE WHEN f.sentiment = 'POSITIVE' THEN 1 END) AS positive,
             COUNT(CASE WHEN f.sentiment = 'NEUTRAL'  THEN 1 END) AS neutral,
             COUNT(CASE WHEN f.sentiment = 'NEGATIVE' THEN 1 END) AS negative
      FROM "Feedback" f
      INNER JOIN "Event" e ON f."eventId" = e.id
      WHERE f."createdAt" >= NOW() - INTERVAL '6 months'
        AND e."collegeId" = ${req.user.collegeId}
      GROUP BY DATE_TRUNC('month', f."createdAt"), TO_CHAR(DATE_TRUNC('month', f."createdAt"), 'Mon YYYY')
      ORDER BY DATE_TRUNC('month', f."createdAt")
    `;

    // Topic frequency
    const feedbacksWithTopics = await prisma.feedback.findMany({
      where: { event: { collegeId: req.user.collegeId } },
      select: { topics: true, sentiment: true }
    });

    const posTopics = {};
    const negTopics = {};
    for (const fb of feedbacksWithTopics) {
      const tops = fb.topics || [];
      for (const t of tops) {
        if (fb.sentiment === 'POSITIVE') posTopics[t] = (posTopics[t] || 0) + 1;
        if (fb.sentiment === 'NEGATIVE') negTopics[t] = (negTopics[t] || 0) + 1;
      }
    }

    const topPositiveTopics = Object.entries(posTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count }));

    const topNegativeTopics = Object.entries(negTopics)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([topic, count]) => ({ topic, count }));

    // Overall distribution
    const distribution = await prisma.feedback.groupBy({
      by: ['sentiment'],
      where: { event: { collegeId: req.user.collegeId } },
      _count: { _all: true },
    });

    res.json({
      sentimentOverTime: sentimentOverTime.map(r => ({
        month: r.month,
        positive: Number(r.positive),
        neutral: Number(r.neutral),
        negative: Number(r.negative),
      })),
      topPositiveTopics,
      topNegativeTopics,
      distribution: distribution.map(d => ({
        sentiment: d.sentiment,
        count: d._count._all,
      })),
    });
  } catch (err) {
    console.error('[analytics/feedback]', err);
    res.status(500).json({ error: 'Failed to load feedback analytics' });
  }
});

// ── /api/admin/analytics/predictions ─────────────────────────────────────────
router.get('/predictions', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    // Try ML service first
    const mlResult = await callML('/ml/prediction/all-events', 'GET');
    if (mlResult && mlResult.predictions && mlResult.predictions.length > 0) {
      return res.json(mlResult.predictions);
    }

    // Fallback: from EventPrediction table
    const preds = await prisma.eventPrediction.findMany({
      where: { event: { collegeId: req.user.collegeId } },
      include: {
        event: {
          select: {
            title: true, category: true, capacity: true, status: true,
            _count: { select: { registrations: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (preds.length > 0) {
      return res.json(preds.map(p => {
        const current = p.event._count.registrations;
        const ratio = p.predictedRegistrations / (p.event.capacity || 1);
        return {
          id: p.eventId,
          eventTitle: p.event.title,
          category: p.event.category,
          currentRegistrations: current,
          capacity: p.event.capacity,
          predictedRegistrations: p.predictedRegistrations,
          confidence: p.confidence,
          demandStatus: ratio >= 0.9 ? 'HIGH_DEMAND' : ratio >= 0.6 ? 'MODERATE_DEMAND' : 'LOW_DEMAND',
        };
      }));
    }

    // Fallback: compute rough estimates from registrations
    const events = await prisma.event.findMany({
      where: { status: 'PUBLISHED', collegeId: req.user.collegeId },
      include: { _count: { select: { registrations: true } } },
      take: 20,
    });
    res.json(events.map(e => {
      const current = e._count.registrations;
      const predicted = Math.round(current * 1.2);
      const ratio = predicted / (e.capacity || 1);
      return {
        id: e.id,
        eventTitle: e.title,
        category: e.category,
        currentRegistrations: current,
        capacity: e.capacity,
        predictedRegistrations: predicted,
        confidence: 0.6,
        demandStatus: ratio >= 0.9 ? 'HIGH_DEMAND' : ratio >= 0.6 ? 'MODERATE_DEMAND' : 'LOW_DEMAND',
      };
    }));
  } catch (err) {
    console.error('[analytics/predictions]', err);
    res.status(500).json({ error: 'Failed to load predictions' });
  }
});

// ── /api/admin/analytics/insights ────────────────────────────────────────────
router.get('/insights', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    // Try generating fresh insights via ML service
    const mlResult = await callML('/ml/insights/generate', 'GET');
    if (mlResult && mlResult.insights && mlResult.insights.length > 0) {
      return res.json(mlResult.insights.map((ins, i) => ({
        id: `insight_${i}`,
        type: ins.type,
        title: ins.title,
        description: ins.description,
        severity: ins.severity,
        timestamp: new Date().toISOString(),
        relatedEvent: ins.relatedCategory || null,
      })));
    }

    // Fallback: from AIInsight table
    const stored = await prisma.aIInsight.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    res.json(stored.map(ins => ({
      id: ins.id,
      type: ins.type,
      title: ins.title,
      description: ins.description,
      severity: ins.severity,
      timestamp: ins.createdAt,
      relatedEvent: ins.metadata?.relatedCategory || null,
    })));
  } catch (err) {
    console.error('[analytics/insights]', err);
    res.status(500).json({ error: 'Failed to load insights' });
  }
});

// ── /api/admin/analytics/recommendations ─────────────────────────────────────
router.get('/recommendations', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const recs = await prisma.recommendation.groupBy({
      by: ['eventId'],
      _count: { _all: true },
      _avg: { score: true },
      orderBy: { _count: { eventId: 'desc' } },
      take: 10,
    });

    const eventIds = recs.map(r => r.eventId);
    const events = await prisma.event.findMany({
      where: { id: { in: eventIds } },
      select: { id: true, title: true, category: true }
    });
    const evMap = Object.fromEntries(events.map(e => [e.id, e]));

    res.json({
      topRecommendedEvents: recs.map(r => ({
        eventId: r.eventId,
        title: evMap[r.eventId]?.title || 'Unknown',
        category: evMap[r.eventId]?.category || '',
        recommendedToCount: r._count._all,
        avgScore: Math.round((r._avg.score || 0) * 1000) / 1000,
      })),
    });
  } catch (err) {
    console.error('[analytics/recommendations]', err);
    res.status(500).json({ error: 'Failed to load recommendations' });
  }
});

// ── /api/admin/organizers ─────────────────────────────────────────────────────
router.get('/organizers', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const organizers = await prisma.organizer.findMany({
      where: { collegeId: req.user.collegeId },
      include: {
        _count: { select: { events: true } }
      },
    });

    res.json(organizers.map(o => ({
      id: o.id,
      name: o.name,
      email: o.email,
      department: o.department,
      organizationName: o.organizationName,
      totalEvents: o._count.events,
    })));
  } catch (err) {
    console.error('[admin/organizers]', err);
    res.status(500).json({ error: 'Failed to load organizers' });
  }
});

router.put('/organizers/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, department, organizationName, password } = req.body;
    
    // Verify organizer belongs to the same college as admin
    const existing = await prisma.organizer.findUnique({ where: { id } });
    if (!existing || existing.collegeId !== req.user.collegeId) {
      return res.status(404).json({ error: 'Organizer not found' });
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
    res.status(500).json({ error: 'Failed to update organizer' });
  }
});

router.delete('/organizers/:id', authenticateToken, authorizeRoles('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verify organizer belongs to the same college as admin
    const existing = await prisma.organizer.findUnique({ where: { id } });
    if (!existing || existing.collegeId !== req.user.collegeId) {
      return res.status(404).json({ error: 'Organizer not found' });
    }

    await prisma.organizer.delete({
      where: { id }
    });
    
    res.json({ message: 'Organizer deleted successfully' });
  } catch (err) {
    console.error('[DELETE admin/organizers]', err);
    res.status(500).json({ error: 'Failed to delete organizer' });
  }
});

module.exports = router;
