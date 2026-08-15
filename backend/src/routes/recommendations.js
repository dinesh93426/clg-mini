/**
 * Student recommendation routes
 * GET /api/students/:studentId/recommendations
 *
 * EventCard expects these field names from the frontend mock data:
 *   date, time, organizer, availableSeats, image, aiRecommended,
 *   aiMatchPercentage, recommendationReason
 * We normalise from DB camelCase names before returning.
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

/** Normalise a DB event row into the shape EventCard and the student pages expect. */
function normaliseEvent(ev, recScore = 0.5, recReason = '', algorithm = 'hybrid') {
  const dateObj   = ev.eventDate ? new Date(ev.eventDate) : null;
  const dateStr   = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const timeStr   = ev.startTime ? ev.startTime.toString().slice(0, 5) : '';
  const capacity  = ev.capacity || 100;
  const current   = ev.currentRegistrations ?? ev._count?.registrations ?? 0;
  const available = Math.max(0, capacity - current);
  const pct       = Math.round(recScore * 100);

  return {
    id:                   ev.id,
    title:                ev.title,
    description:          ev.description,
    category:             ev.category,
    // EventCard-compatible field names
    date:                 dateStr,
    time:                 timeStr,
    venue:                ev.venue || '',
    organizer:            ev.organizerName || ev.organizer?.name || '',
    image:                ev.image || `https://picsum.photos/seed/${ev.id}/400/200`,
    availableSeats:       available,
    totalSeats:           capacity,
    status:               ev.status,
    // AI recommendation fields
    aiRecommended:        true,
    aiMatchPercentage:    pct,
    recommendationScore:  recScore,
    recommendationReason: recReason,
    algorithm,
  };
}

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function callML(path) {
  try {
    const resp = await fetch(`${ML_URL}${path}`);
    if (!resp.ok) return null;
    return await resp.json();
  } catch (e) {
    console.warn('[recommendations] ML call failed:', e.message);
    return null;
  }
}

router.get('/:studentId/recommendations', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Only allow student to get their own recommendations, or admin
    if (req.user.role === 'STUDENT' && req.user.userId !== studentId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Try ML service
    const mlResult = await callML(`/ml/recommendation/${studentId}`);
    if (mlResult && mlResult.recommendations && mlResult.recommendations.length > 0) {
      // Fetch full event details from DB to ensure freshness
      const eventIds = mlResult.recommendations.map(r => r.event_id);
      const events = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        include: {
          organizer: { select: { name: true } },
          _count: { select: { registrations: true } }
        }
      });
      const evMap = Object.fromEntries(events.map(e => [e.id, e]));

      const recommendations = mlResult.recommendations.map(r => {
        const ev = evMap[r.event_id];
        if (!ev) return null;
        ev.currentRegistrations = ev._count.registrations;
        return normaliseEvent(ev, r.score, r.reason, r.algorithm || 'hybrid');
      }).filter(Boolean);

      return res.json(recommendations);
    }

    // Fallback: return stored recommendations from DB
    const stored = await prisma.recommendation.findMany({
      where: { studentId },
      include: {
        event: {
          include: {
            organizer: { select: { name: true } },
            _count: { select: { registrations: true } }
          }
        }
      },
      orderBy: { score: 'desc' },
      take: 10,
    });

    if (stored.length > 0) {
      return res.json(stored.map(r => {
        r.event.currentRegistrations = r.event._count.registrations;
        r.event.organizerName = r.event.organizer?.name || '';
        return normaliseEvent(r.event, r.score, r.reason, r.algorithm);
      }));
    }

    // Final fallback: return popular published events
    const popular = await prisma.event.findMany({
      where: { status: 'PUBLISHED' },
      include: {
        organizer: { select: { name: true } },
        _count: { select: { registrations: true } }
      },
      orderBy: { registrations: { _count: 'desc' } },
      take: 10,
    });

    res.json(popular.map(e => {
      e.currentRegistrations = e._count.registrations;
      e.organizerName = e.organizer?.name || '';
      return normaliseEvent(e, 0.5, 'Popular event', 'popularity');
    }));
  } catch (err) {
    console.error('[recommendations]', err);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

module.exports = router;
