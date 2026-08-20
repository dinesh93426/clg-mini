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

    // Feedback Intelligence processing
    const feedbacks = await prisma.feedback.findMany({
      where: { event: { organizerId } }
    });

    let positive = 0, neutral = 0, negative = 0;
    const topicCounts = {};
    const positiveTopics = {};
    const negativeTopics = {};
    
    feedbacks.forEach(f => {
      // Calculate Sentiment
      const isPositive = f.sentiment === 'Positive' || f.sentiment === 'POSITIVE' || (!f.sentiment && f.rating >= 4);
      const isNegative = f.sentiment === 'Negative' || f.sentiment === 'NEGATIVE' || (!f.sentiment && f.rating <= 2);
      
      if (isPositive) positive++;
      else if (isNegative) negative++;
      else neutral++;

      // Process Topics
      if (f.topics && Array.isArray(f.topics)) {
        f.topics.forEach(t => {
          const topicName = typeof t === 'string' ? t : t.name;
          if (!topicName) return;
          topicCounts[topicName] = (topicCounts[topicName] || 0) + 1;
          
          if (isPositive) positiveTopics[topicName] = (positiveTopics[topicName] || 0) + 1;
          if (isNegative) negativeTopics[topicName] = (negativeTopics[topicName] || 0) + 1;
        });
      }
    });

    const totalFb = feedbacks.length || 1; // avoid division by zero
    const feedbackSentiment = {
      positive: Math.round((positive / totalFb) * 100),
      neutral: Math.round((neutral / totalFb) * 100),
      negative: Math.round((negative / totalFb) * 100)
    };

    // Format topics
    const feedbackTopics = Object.keys(topicCounts).map(name => {
      const posCount = positiveTopics[name] || 0;
      const negCount = negativeTopics[name] || 0;
      const total = topicCounts[name];
      const sentiment = posCount >= negCount ? (posCount > negCount ? 'positive' : 'neutral') : 'negative';
      return {
        name,
        sentiment,
        score: Math.round((posCount / total) * 100)
      };
    }).sort((a, b) => b.score - a.score).slice(0, 5); // top 5 topics

    // Dynamic AI Event Summary
    let aiEventSummary = null;
    if (feedbacks.length > 0) {
      const topStrengths = feedbackTopics.filter(t => t.sentiment === 'positive').map(t => `Students appreciated the ${t.name}.`);
      const topIssues = feedbackTopics.filter(t => t.sentiment === 'negative').map(t => `Concerns were raised regarding ${t.name}.`);
      
      aiEventSummary = {
        text: `Analysis of ${feedbacks.length} recent feedbacks indicates a ${feedbackSentiment.positive}% positive response rate.`,
        strengths: topStrengths.length > 0 ? topStrengths : ["General positive feedback received on event execution."],
        issues: topIssues.length > 0 ? topIssues : ["No major issues reported."],
        improvements: topIssues.length > 0 ? topIssues.map(i => `Consider addressing the feedback around ${i.replace('Concerns were raised regarding ', '')}.`) : ["Continue maintaining current event quality."]
      };
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
      feedbackSentiment: feedbacks.length > 0 ? feedbackSentiment : undefined,
      feedbackTopics: feedbacks.length > 0 ? feedbackTopics : undefined,
      aiEventSummary: aiEventSummary
    });
  } catch (err) {
    console.error('[organizer/overview]', err);
    res.status(500).json({ error: 'Failed to load organizer analytics' });
  }
});

module.exports = router;
