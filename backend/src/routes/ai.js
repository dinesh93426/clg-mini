/**
 * AI routes — bridges frontend to ML service
 * POST /api/ai/assistant   — RAG chat
 * POST /api/ai/generator   — AI event generation
 */
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

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
    const { messages, studentProfile } = req.body;
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    // ML service expects {role, content} — frontend sends {role, text}
    const mlMessages = messages.map(m => ({
      role: (m.role === 'ai' || m.role === 'assistant') ? 'assistant' : (m.role || 'user'),
      content: m.content || m.text || '',
    }));

    const result = await callML('/ml/rag/chat', { messages: mlMessages, student_profile: studentProfile || null });

    res.json({
      role: 'ai',
      text: result.text || result.answer || 'I could not generate a response.',
      sources: result.sources || [],
      suggestions: result.suggestions || [],
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
    console.error('[ai/generator]', err);
    res.status(500).json({ error: 'Event generation failed. Please try again.' });
  }
});

module.exports = router;
