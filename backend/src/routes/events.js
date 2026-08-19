const express = require('express');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

function normaliseEvent(ev) {
  const dateObj = ev.eventDate ? new Date(ev.eventDate) : null;
  const dateStr = dateObj && !isNaN(dateObj.getTime())
    ? dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : (ev.date || 'Upcoming');

  const timeStr = ev.startTime
    ? (typeof ev.startTime === 'object' ? new Date(ev.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : String(ev.startTime).slice(0, 5))
    : (ev.time || '10:00 AM');

  const capacity = ev.capacity || ev.totalSeats || 100;
  const current = ev.currentRegistrations ?? ev._count?.registrations ?? ev.registrationCount ?? 0;
  const available = typeof ev.availableSeats === 'number'
    ? ev.availableSeats
    : Math.max(0, capacity - current);

  const orgName = ev.organizer?.organizationName || ev.organizer?.name || ev.organizerName || (typeof ev.organizer === 'string' ? ev.organizer : 'Campus Organizer');

  return {
    ...ev,
    id: ev.id,
    title: ev.title,
    description: ev.description,
    category: typeof ev.category === 'object' ? ev.category.name : ev.category,
    date: dateStr,
    time: timeStr,
    venue: ev.venue || 'Campus Main Hall',
    organizer: orgName,
    department: ev.department || ev.organizer?.department || 'General',
    image: ev.image || ev.posterUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600`,
    availableSeats: available,
    totalSeats: capacity,
    registrationCount: current
  };
}

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await prisma.event.findMany({
      include: {
        organizer: { select: { name: true, organizationName: true, department: true } },
        _count: { select: { registrations: true } }
      },
      orderBy: { eventDate: 'asc' }
    });
    res.json(events.map(normaliseEvent));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by id
router.get('/:id', async (req, res) => {
  try {
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: { select: { name: true, organizationName: true, department: true } },
        _count: { select: { registrations: true } }
      }
    });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json(normaliseEvent(event));
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
