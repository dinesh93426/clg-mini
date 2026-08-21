/**
 * Registration routes
 * POST /api/events/:eventId/register
 * GET  /api/registrations
 * POST /api/registrations/:regId/cancel
 * POST /api/registrations/:regId/feedback
 */
const express = require('express');
const router = express.Router();
const prisma = require('../db');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { sendRegistrationConfirmationEmail } = require('../services/emailService');

// Register for an event
router.post('/events/:eventId/register', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const { eventId } = req.params;
    const studentId = req.user.userId;

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.status !== 'PUBLISHED') return res.status(400).json({ error: 'Event is not open for registration' });

    // Check capacity
    const regCount = await prisma.registration.count({
      where: { eventId, status: 'REGISTERED' }
    });
    if (regCount >= event.capacity) return res.status(400).json({ error: 'Event is at full capacity' });

    // Idempotent — check existing
    const existing = await prisma.registration.findFirst({
      where: { studentId, eventId }
    });
    if (existing) {
      if (existing.status === 'REGISTERED') return res.status(400).json({ error: 'Already registered' });
      // Re-activate cancelled registration
      const updated = await prisma.registration.update({
        where: { id: existing.id },
        data: { status: 'REGISTERED', registeredAt: new Date() }
      });
      await prisma.eventInteraction.create({
        data: { studentId, eventId, interactionType: 'REGISTER' }
      });
      
      const emailRes = await sendRegistrationConfirmationEmail({ student, event, registration: updated });
      return res.json({ success: true, registration: updated, email: emailRes });
    }

    const registration = await prisma.registration.create({
      data: { studentId, eventId, status: 'REGISTERED' }
    });
    await prisma.eventInteraction.create({
      data: { studentId, eventId, interactionType: 'REGISTER' }
    });

    const emailRes = await sendRegistrationConfirmationEmail({ student, event, registration });

    res.status(201).json({ success: true, registration, email: emailRes });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Get student's registrations
router.get('/registrations', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const studentId = req.user.userId;
    const regs = await prisma.registration.findMany({
      where: { studentId, status: 'REGISTERED' },
      include: {
        event: {
          include: {
            organizer: { select: { name: true } }
          }
        }
      },
      orderBy: { registeredAt: 'desc' }
    });

    // Attach feedback and attendance status
    const regIds = regs.map(r => r.eventId);
    const feedbacks = await prisma.feedback.findMany({
      where: { studentId, eventId: { in: regIds } }
    });
    const fbMap = Object.fromEntries(feedbacks.map(f => [f.eventId, f]));

    const attendances = await prisma.attendance.findMany({
      where: { studentId, eventId: { in: regIds } }
    });
    const attMap = Object.fromEntries(attendances.map(a => [a.eventId, a]));

    const result = regs.map(r => ({
      ...r,
      feedback: fbMap[r.eventId] || null,
      hasFeedback: !!fbMap[r.eventId],
      attendance: attMap[r.eventId] ? attMap[r.eventId].status : null
    }));

    res.json(result);
  } catch (err) {
    console.error('[registrations]', err);
    res.status(500).json({ error: 'Failed to fetch registrations' });
  }
});

// Cancel registration
router.post('/registrations/:regId/cancel', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const { regId } = req.params;
    const studentId = req.user.userId;

    const reg = await prisma.registration.findUnique({ where: { id: regId } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.studentId !== studentId) return res.status(403).json({ error: 'Not your registration' });
    if (reg.status === 'CANCELLED') return res.status(400).json({ error: 'Already cancelled' });

    const updated = await prisma.registration.update({
      where: { id: regId },
      data: { status: 'CANCELLED' }
    });
    await prisma.eventInteraction.create({
      data: { studentId, eventId: reg.eventId, interactionType: 'CANCEL' }
    });

    res.json(updated);
  } catch (err) {
    console.error('[cancel]', err);
    res.status(500).json({ error: 'Cancellation failed' });
  }
});

// Resend Event Pass to Email
router.post('/registrations/:regId/resend-pass', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const { regId } = req.params;
    const studentId = req.user.userId;

    const registration = await prisma.registration.findUnique({
      where: { id: regId },
      include: { event: true, student: true }
    });

    if (!registration) return res.status(404).json({ error: 'Registration not found' });
    if (registration.studentId !== studentId) return res.status(403).json({ error: 'Access denied' });
    if (registration.status !== 'REGISTERED') return res.status(400).json({ error: 'Registration is not active' });

    const emailRes = await sendRegistrationConfirmationEmail({
      student: registration.student,
      event: registration.event,
      registration
    });

    res.json({ success: true, email: emailRes });
  } catch (err) {
    console.error('[resend-pass]', err);
    res.status(500).json({ error: 'Failed to resend pass' });
  }
});

// Submit feedback for a registration
router.post('/registrations/:regId/feedback', authenticateToken, authorizeRoles('STUDENT'), async (req, res) => {
  try {
    const { regId } = req.params;
    const studentId = req.user.userId;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1-5' });
    }

    const reg = await prisma.registration.findUnique({ where: { id: regId } });
    if (!reg) return res.status(404).json({ error: 'Registration not found' });
    if (reg.studentId !== studentId) return res.status(403).json({ error: 'Not your registration' });

    // Check attendance
    const attendance = await prisma.attendance.findFirst({
      where: { studentId, eventId: reg.eventId, status: 'PRESENT' }
    });

    // Allow feedback even without attendance (for flexibility)
    const existing = await prisma.feedback.findFirst({
      where: { studentId, eventId: reg.eventId }
    });
    if (existing) return res.status(400).json({ error: 'Feedback already submitted' });

    // Sentiment via ML service (best-effort)
    let sentimentData = { sentiment: null, score: null };
    if (comment) {
      try {
        const mlRes = await callML('POST', '/ml/sentiment/analyze', { text: comment });
        if (mlRes && mlRes.sentiment) {
          sentimentData = { sentiment: mlRes.sentiment, score: mlRes.score };
        }
      } catch (_) {}
    }

    const feedback = await prisma.feedback.create({
      data: {
        studentId,
        eventId: reg.eventId,
        rating: parseInt(rating),
        comment: comment || null,
        sentiment: sentimentData.sentiment,
        sentimentScore: sentimentData.score,
        topics: [],
      }
    });

    res.status(201).json(feedback);
  } catch (err) {
    console.error('[feedback]', err);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
});

/**
 * Helper: call the ML service
 */
async function callML(method, path, body = null) {
  const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
  const url = `${ML_URL}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (body) opts.body = JSON.stringify(body);
  const resp = await fetch(url, opts);
  if (!resp.ok) throw new Error(`ML service ${resp.status}`);
  return resp.json();
}

module.exports = router;
module.exports.callML = callML;
