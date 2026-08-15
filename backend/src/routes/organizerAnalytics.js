/**
 * Organizer analytics routes
 * GET /api/organizer/analytics/overview
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// ── /api/organizer/analytics/overview ─────────────────────────────────────────
router.get('/overview', authenticateToken, authorizeRoles('ORGANIZER'), async (req, res) => {
  try {
    const organizerId = req.user.userId;

    const events = await prisma.event.findMany({
      where: { organizerId },
      include: {
        _count: {
          select: { registrations: true, attendances: true, feedbacks: true }
        }
      },
      orderBy: { eventDate: 'desc' }
    });

    const totalEvents    = events.length;
    const publishedEvents = events.filter(e => e.status === 'PUBLISHED').length;
    const completedEvents = events.filter(e => e.status === 'COMPLETED').length;
    const totalRegs      = events.reduce((s, e) => s + e._count.registrations, 0);
    const totalAttended  = events.reduce((s, e) => s + e._count.attendances, 0);

    // Average rating
    const avgRatingResult = await prisma.feedback.aggregate({
      where: { event: { organizerId } },
      _avg: { rating: true }
    });

    // Upcoming events
    const upcoming = await prisma.event.findMany({
      where: { organizerId, status: 'PUBLISHED', eventDate: { gte: new Date() } },
      orderBy: { eventDate: 'asc' },
      take: 5,
      select: { id: true, title: true, eventDate: true, capacity: true,
                _count: { select: { registrations: true } } }
    });

    // Category breakdown
    const catBreakdown = {};
    for (const e of events) {
      catBreakdown[e.category] = (catBreakdown[e.category] || 0) + 1;
    }

    res.json({
      totalEvents,
      publishedEvents,
      completedEvents,
      totalRegistrations: totalRegs,
      totalAttended,
      attendanceRate: totalRegs > 0 ? Math.round(totalAttended / totalRegs * 100) : 0,
      avgRating: avgRatingResult._avg.rating ? Math.round(avgRatingResult._avg.rating * 10) / 10 : 0,
      upcoming: upcoming.map(u => ({
        id: u.id,
        title: u.title,
        eventDate: u.eventDate,
        capacity: u.capacity,
        registrations: u._count.registrations,
        fillRate: Math.round(u._count.registrations / (u.capacity || 1) * 100),
      })),
      categoryBreakdown: Object.entries(catBreakdown).map(([cat, count]) => ({ category: cat, count })),
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        category: e.category,
        status: e.status,
        eventDate: e.eventDate,
        capacity: e.capacity,
        registrations: e._count.registrations,
        attended: e._count.attendances,
        feedbacks: e._count.feedbacks,
      })),
    });
  } catch (err) {
    console.error('[organizer/overview]', err);
    res.status(500).json({ error: 'Failed to load organizer analytics' });
  }
});

module.exports = router;
