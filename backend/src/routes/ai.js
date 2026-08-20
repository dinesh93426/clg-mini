/**
 * AI routes — bridges frontend to ML service
 * POST /api/ai/assistant                    — RAG chat
 * POST /api/ai/generator                    — AI event generation
 * POST /api/ai/sentiment/analyze/:feedbackId — Analyze specific feedback record
 * GET  /api/ai/sentiment/event/:eventId     — Event feedback sentiment analytics
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const prisma = require('../db');

const ML_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

async function callML(path, body) {
  const resp = await fetch(`${ML_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`ML service error ${resp.status}: ${text}`);
  }
  return resp.json();
}

// POST /api/ai/assistant
router.post('/assistant', authenticateToken, async (req, res) => {
  try {
    const { question, messages, studentProfile, conversationId, filters } = req.body;

    let result;
    if (question && typeof question === 'string') {
      // Direct RAG question endpoint
      result = await callML('/api/v1/rag/ask', {
        question: question.trim(),
        conversation_id: conversationId || null,
        filters: filters || null
      });
    } else if (messages && Array.isArray(messages) && messages.length > 0) {
      // Chat conversation endpoint
      const mlMessages = messages.map(m => ({
        role: (m.role === 'ai' || m.role === 'assistant') ? 'assistant' : (m.role || 'user'),
        content: m.content || m.text || '',
      }));
      result = await callML('/ml/rag/chat', { messages: mlMessages, student_profile: studentProfile || null });
    } else {
      return res.status(400).json({ error: 'Either question string or messages array is required.' });
    }

    res.json({
      role: 'ai',
      text: result.text || result.answer || 'I could not generate a response.',
      answer: result.answer || result.text || '',
      sources: result.sources || [],
      suggestions: result.suggestions || ['What technical workshops are happening?', 'Tell me about hackathons'],
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ai/assistant]', err);
    // Graceful degradation
    res.json({
      role: 'ai',
      text: 'I\'m having trouble connecting to the AI service right now. Please try again in a moment.',
      sources: [],
      suggestions: ['What events are coming up?', 'How do I register?'],
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/ai/generator
router.post('/generator', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || !prompt.trim()) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const organizerId = req.user.userId;
    const result = await callML('/ml/generator/generate', {
      prompt,
      organizer_id: organizerId,
    });

    res.json(result);
  } catch (err) {
    console.error('[ai/generator]', err.message || err);
    
    // Fallback to mock data if the ML service is unreachable or fails
    const mockEvent = {
      title: "AI & Machine Learning Workshop",
      category: "Technology",
      description: "An intensive hands-on workshop covering the fundamentals of AI and machine learning. Participants will build real models and understand deployment strategies.",
      targetAudience: "Computer Science and Engineering students",
      objectives: [
        "Understand core ML concepts",
        "Implement models with scikit-learn and PyTorch",
        "Deploy a simple ML API"
      ],
      agenda: [
        { time: "09:00", activity: "Introduction to AI/ML" },
        { time: "10:00", activity: "Hands-on: Data preprocessing" },
        { time: "11:00", activity: "Model training and evaluation" },
        { time: "12:00", activity: "Lunch break" },
        { time: "13:00", activity: "Model deployment" },
        { time: "14:30", activity: "Q&A and wrap-up" }
      ],
      requirements: ["Laptop with Python 3.10+", "Basic Python knowledge"],
      suggestedDuration: "6 hours",
      tags: ["AI", "Machine Learning", "Python", "Technology"],
      suggestedCapacity: 50
    };

    res.json(mockEvent);
  }
});

// POST /api/ai/sentiment/analyze/:feedbackId
router.post('/sentiment/analyze/:feedbackId', async (req, res) => {
  try {
    const { feedbackId } = req.params;
    const feedback = await prisma.feedback.findUnique({
      where: { id: feedbackId },
    });

    if (!feedback) {
      return res.status(404).json({ error: `Feedback with id ${feedbackId} not found.` });
    }

    if (!feedback.comment || !feedback.comment.trim()) {
      return res.status(400).json({ error: 'Feedback record contains no text to analyze.' });
    }

    // Call ML service Transformer sentiment analyzer
    const mlRes = await callML('/api/v1/sentiment/analyze', { text: feedback.comment });

    // Update PostgreSQL record using raw query / update to store sentiment, score, model, analyzedAt
    await prisma.$executeRaw`
      UPDATE "Feedback"
      SET sentiment = ${mlRes.sentiment},
          "sentimentScore" = ${mlRes.confidence},
          "sentimentModel" = ${mlRes.model},
          "sentimentAnalyzedAt" = NOW(),
          topics = ${mlRes.topics || []}
      WHERE id = ${feedbackId}
    `;

    res.json({
      feedbackId,
      sentiment: mlRes.sentiment,
      sentimentScore: mlRes.confidence,
      sentimentModel: mlRes.model,
      topics: mlRes.topics || [],
      sentimentAnalyzedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[ai/sentiment/analyze]', err);
    res.status(500).json({ error: err.message || 'Sentiment analysis failed.' });
  }
});

// GET /api/ai/sentiment/event/:eventId
router.get('/sentiment/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const feedbacks = await prisma.feedback.findMany({
      where: { eventId },
    });

    if (!feedbacks || feedbacks.length === 0) {
      return res.json({
        eventId,
        totalFeedback: 0,
        averageRating: 0,
        positivePercentage: 0,
        neutralPercentage: 0,
        negativePercentage: 0,
      });
    }

    const total = feedbacks.length;
    const pos = feedbacks.filter(f => f.sentiment === 'POSITIVE').length;
    const neu = feedbacks.filter(f => f.sentiment === 'NEUTRAL').length;
    const neg = feedbacks.filter(f => f.sentiment === 'NEGATIVE').length;
    const avgRating = feedbacks.reduce((acc, f) => acc + (f.rating || 0), 0) / total;

    res.json({
      eventId,
      totalFeedback: total,
      averageRating: parseFloat(avgRating.toFixed(2)),
      positivePercentage: parseFloat(((pos / total) * 100).toFixed(1)),
      neutralPercentage: parseFloat(((neu / total) * 100).toFixed(1)),
      negativePercentage: parseFloat(((neg / total) * 100).toFixed(1)),
    });
  } catch (err) {
    console.error('[ai/sentiment/event]', err);
    res.status(500).json({ error: 'Failed to retrieve event feedback sentiment analytics.' });
  }
});

// GET /api/ai/recommendations/:studentId
router.get('/recommendations/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    // Authorization: Student can request their own recommendations, or ADMIN can request any
    const isSelf = req.user.userId === studentId || req.user.id === studentId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Forbidden: You can only view your own recommendations.' });
    }

    const resp = await fetch(`${ML_URL}/api/v1/recommendations/${studentId}?limit=${limit}`);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }

    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/recommendations]', err);
    res.status(500).json({ error: 'Failed to generate recommendations. Please try again later.' });
  }
});

// ─── AI Event Poster Generator Endpoints ────────────────────────────────────

// POST /api/ai/poster/generate
router.post('/poster/generate', authenticateToken, async (req, res) => {
  try {
    const { prompt, style, format, colorPreference, logoUrl } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt is required for poster generation.' });
    }

    const result = await callML('/api/v1/poster/generate', {
      prompt: prompt.trim(),
      style: style || null,
      format: format || '1080x1350',
      colorPreference: colorPreference || null,
      logoUrl: logoUrl || null,
    });

    res.json(result);
  } catch (err) {
    console.error('[ai/poster/generate]', err);
    res.status(500).json({ error: 'Failed to generate event poster.' });
  }
});

// POST /api/ai/poster/regenerate
router.post('/poster/regenerate', authenticateToken, async (req, res) => {
  try {
    const { eventData, style, format, additionalInstruction, logoUrl } = req.body;
    if (!eventData) {
      return res.status(400).json({ error: 'eventData is required for regeneration.' });
    }

    const result = await callML('/api/v1/poster/regenerate', {
      eventData,
      style: style || 'Futuristic',
      format: format || '1080x1350',
      additionalInstruction: additionalInstruction || null,
      logoUrl: logoUrl || null,
    });

    res.json(result);
  } catch (err) {
    console.error('[ai/poster/regenerate]', err);
    res.status(500).json({ error: 'Failed to regenerate event poster.' });
  }
});

// POST /api/ai/poster/change-style
router.post('/poster/change-style', authenticateToken, async (req, res) => {
  try {
    const { eventData, style, format, logoUrl } = req.body;
    if (!eventData || !style) {
      return res.status(400).json({ error: 'eventData and style are required.' });
    }

    const result = await callML('/api/v1/poster/change-style', {
      eventData,
      style,
      format: format || '1080x1350',
      logoUrl: logoUrl || null,
    });

    res.json(result);
  } catch (err) {
    console.error('[ai/poster/change-style]', err);
    res.status(500).json({ error: 'Failed to update poster style.' });
  }
});

// POST /api/ai/poster/render (Text edit re-render)
router.post('/poster/render', authenticateToken, async (req, res) => {
  try {
    const { eventData, backgroundImageUrl, style, format, logoUrl } = req.body;
    if (!eventData || !backgroundImageUrl) {
      return res.status(400).json({ error: 'eventData and backgroundImageUrl are required.' });
    }

    const result = await callML('/api/v1/poster/render', {
      eventData,
      backgroundImageUrl,
      style: style || 'Futuristic',
      format: format || '1080x1350',
      logoUrl: logoUrl || null,
    });

    res.json(result);
  } catch (err) {
    console.error('[ai/poster/render]', err);
    res.status(500).json({ error: 'Failed to render poster text layout.' });
  }
});

// GET /api/ai/poster/:eventId
router.get('/poster/:eventId', authenticateToken, async (req, res) => {
  try {
    const { eventId } = req.params;
    const resp = await fetch(`${ML_URL}/api/v1/poster/${eventId}`);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/poster/get]', err);
    res.status(500).json({ error: 'Failed to retrieve event posters.' });
  }
});

// POST /api/ai/poster/:posterId/publish
router.post('/poster/:posterId/publish', authenticateToken, async (req, res) => {
  try {
    const { posterId } = req.params;
    const resp = await fetch(`${ML_URL}/api/v1/poster/${posterId}/publish`, { method: 'POST' });
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/poster/publish]', err);
    res.status(500).json({ error: 'Failed to publish poster.' });
  }
});

// ─── AI Event Analytics & Insights Endpoints ──────────────────────────────

// GET /api/ai/analytics/overview
router.get('/analytics/overview', authenticateToken, async (req, res) => {
  try {
    const qs = new URLSearchParams(req.query);
    if (req.user.role === 'ADMIN' && req.user.collegeId) {
      qs.set('collegeId', req.user.collegeId);
    }
    const qsStr = qs.toString();
    const url = `${ML_URL}/api/v1/analytics/overview${qsStr ? '?' + qsStr : ''}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/analytics/overview]', err);
    res.status(500).json({ error: 'Failed to retrieve analytics overview.' });
  }
});

// GET /api/ai/analytics/events
router.get('/analytics/events', authenticateToken, async (req, res) => {
  try {
    const url = req.user.role === 'ADMIN' && req.user.collegeId 
      ? `${ML_URL}/api/v1/analytics/events?collegeId=${req.user.collegeId}` 
      : `${ML_URL}/api/v1/analytics/events`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/analytics/events]', err);
    res.status(500).json({ error: 'Failed to retrieve event performance analytics.' });
  }
});

// GET /api/ai/analytics/sentiment
router.get('/analytics/sentiment', authenticateToken, async (req, res) => {
  try {
    const url = req.user.role === 'ADMIN' && req.user.collegeId 
      ? `${ML_URL}/api/v1/analytics/sentiment?collegeId=${req.user.collegeId}` 
      : `${ML_URL}/api/v1/analytics/sentiment`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/analytics/sentiment]', err);
    res.status(500).json({ error: 'Failed to retrieve sentiment analytics.' });
  }
});

// GET /api/ai/analytics/demand
router.get('/analytics/demand', authenticateToken, async (req, res) => {
  try {
    const url = req.user.role === 'ADMIN' && req.user.collegeId 
      ? `${ML_URL}/api/v1/analytics/demand?collegeId=${req.user.collegeId}` 
      : `${ML_URL}/api/v1/analytics/demand`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/analytics/demand]', err);
    res.status(500).json({ error: 'Failed to retrieve demand analytics.' });
  }
});

// ─── Centralized AI Event Intelligence Dashboard Endpoints ─────────────────

// GET /api/ai/dashboard/organizer
router.get('/dashboard/organizer', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.user.userId || req.user.id;
    const resp = await fetch(`${ML_URL}/api/v1/dashboard/organizer?organizerId=${encodeURIComponent(organizerId)}`);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/dashboard/organizer]', err);
    res.status(500).json({ error: 'Failed to retrieve organizer AI dashboard.' });
  }
});

// GET /api/ai/dashboard/admin
router.get('/dashboard/admin', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden: Admin access required for institution dashboard.' });
    }
    const resp = await fetch(`${ML_URL}/api/v1/dashboard/admin?collegeId=${req.user.collegeId}`);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/dashboard/admin]', err);
    res.status(500).json({ error: 'Failed to retrieve admin AI dashboard.' });
  }
});

// GET /api/ai/dashboard/events
router.get('/dashboard/events', authenticateToken, async (req, res) => {
  try {
    const url = req.user.role === 'ADMIN' && req.user.collegeId 
      ? `${ML_URL}/api/v1/dashboard/events?collegeId=${req.user.collegeId}` 
      : `${ML_URL}/api/v1/dashboard/events`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/dashboard/events]', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard events.' });
  }
});

// GET /api/ai/dashboard/demand
router.get('/dashboard/demand', authenticateToken, async (req, res) => {
  try {
    const url = req.user.role === 'ADMIN' && req.user.collegeId 
      ? `${ML_URL}/api/v1/dashboard/demand?collegeId=${req.user.collegeId}` 
      : `${ML_URL}/api/v1/dashboard/demand`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/dashboard/demand]', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard demand intelligence.' });
  }
});

// GET /api/ai/dashboard/sentiment
router.get('/dashboard/sentiment', authenticateToken, async (req, res) => {
  try {
    const url = req.user.role === 'ADMIN' && req.user.collegeId 
      ? `${ML_URL}/api/v1/dashboard/sentiment?collegeId=${req.user.collegeId}` 
      : `${ML_URL}/api/v1/dashboard/sentiment`;
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/dashboard/sentiment]', err);
    res.status(500).json({ error: 'Failed to retrieve dashboard sentiment intelligence.' });
  }
});

// GET /api/ai/dashboard/alerts
router.get('/dashboard/alerts', authenticateToken, async (req, res) => {
  try {
    const organizerId = req.user.role === 'ORGANIZER' ? (req.user.userId || req.user.id) : null;
    let url = `${ML_URL}/api/v1/dashboard/alerts`;
    if (organizerId) {
      url += `?organizerId=${encodeURIComponent(organizerId)}`;
    } else if (req.user.role === 'ADMIN' && req.user.collegeId) {
      url += `?collegeId=${req.user.collegeId}`;
    }
    const resp = await fetch(url);
    if (!resp.ok) {
      const errText = await resp.text();
      return res.status(resp.status).json({ error: errText });
    }
    const data = await resp.json();
    res.json(data);
  } catch (err) {
    console.error('[ai/dashboard/alerts]', err);
    res.status(500).json({ error: 'Failed to retrieve early warning alerts.' });
  }
});

// POST /api/ai/dashboard/insights
router.post('/dashboard/insights', authenticateToken, async (req, res) => {
  try {
    const qs = req.user.role === 'ADMIN' && req.user.collegeId ? `?collegeId=${req.user.collegeId}` : '';
    const result = await callML(`/api/v1/dashboard/insights${qs}`, req.body || {});
    res.json(result);
  } catch (err) {
    console.error('[ai/dashboard/insights]', err);
    res.status(500).json({ error: 'Failed to generate dashboard insights.' });
  }
});

module.exports = router;
