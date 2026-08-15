const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: { organizer: { select: { name: true } } }
    });
    res.json(events);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by id
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: { organizer: { select: { name: true } } }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (Organizer/Admin only)
router.post('/', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const event = await prisma.event.create({
      data: {
        ...req.body,
        organizerId: req.user.id
      }
    });
    res.status(201).json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (Organizer/Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    // Only allow organizer to update their own event, or admin can update any
    const existingEvent = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!existingEvent) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'ADMIN' && existingEvent.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this event' });
    }

    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// Delete event (Organizer/Admin only)
router.delete('/:id', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const existingEvent = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!existingEvent) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role !== 'ADMIN' && existingEvent.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to modify this event' });
    }

    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;
