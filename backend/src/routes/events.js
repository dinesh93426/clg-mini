const express = require('express');
const { authenticateToken, optionalAuthenticateToken, authorizeRoles } = require('../middleware/auth');
const { getAuthorizedScope, getScopedEventWhere } = require('../middleware/scope');
const prisma = require('../db');
const nodemailer = require('nodemailer');

const router = express.Router();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 465,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  },
  connectionTimeout: 30000,
  greetingTimeout: 30000,
  socketTimeout: 30000
});

transporter.verify()
  .then(() => {
    console.log('[SMTP] Host:', process.env.SMTP_HOST);
    console.log('[SMTP] Port:', process.env.SMTP_PORT);
    console.log('[SMTP] User configured:', !!process.env.SMTP_USER);
    console.log('[SMTP] Password configured:', !!process.env.SMTP_PASSWORD);
    console.log('[SMTP] Verifying connection...');
    console.log('[SMTP] Connection successful');
  })
  .catch((err) => {
    console.error('[SMTP] Connection failed');
    console.error('[SMTP] Code:', err.code);
    console.error('[SMTP] Command:', err.command);
    console.error('[SMTP] Message:', err.message);
  });

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
  const collegeName = ev.college?.name || 'Central College';

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
    collegeName: collegeName,
    collegeId: ev.collegeId,
    department: ev.department || ev.organizer?.department || 'General',
    image: ev.image || ev.posterUrl || `https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=600`,
    availableSeats: available,
    totalSeats: capacity,
    registrationCount: current,
    attendanceCount: ev._count?.attendances ?? 0
  };
}

// Get all events with strict scope enforcement
router.get('/', optionalAuthenticateToken, async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const filterWhere = {};

    if (req.query.category && req.query.category !== 'All') {
      filterWhere.category = { equals: req.query.category, mode: 'insensitive' };
    }

    if (req.query.search) {
      filterWhere.OR = [
        { title: { contains: req.query.search, mode: 'insensitive' } },
        { description: { contains: req.query.search, mode: 'insensitive' } },
        { organizer: { name: { contains: req.query.search, mode: 'insensitive' } } }
      ];
    }

    // Build scoped query
    const where = getScopedEventWhere(scope, filterWhere);

    const events = await prisma.event.findMany({
      where,
      include: {
        organizer: { select: { id: true, name: true, organizationName: true, department: true, collegeId: true } },
        college: { select: { id: true, name: true } },
        _count: { select: { registrations: true, attendances: { where: { status: 'PRESENT' } } } }
      },
      orderBy: { eventDate: 'asc' }
    });

    res.json(events.map(normaliseEvent));
  } catch (error) {
    console.error('[GET /events error]', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get event by id with scoped authorization check
router.get('/:id', optionalAuthenticateToken, async (req, res) => {
  try {
    const scope = getAuthorizedScope(req);
    const event = await prisma.event.findUnique({
      where: { id: req.params.id },
      include: {
        organizer: { select: { id: true, name: true, organizationName: true, department: true, collegeId: true } },
        college: { select: { id: true, name: true } },
        _count: { select: { registrations: true, attendances: { where: { status: 'PRESENT' } } } }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Enforce ownership if requester is Admin or Organizer
    if (scope.isAdmin && scope.collegeId && event.collegeId !== scope.collegeId) {
      return res.status(403).json({ error: 'Forbidden: Event does not belong to your college.' });
    }
    if (scope.isOrganizer && event.organizerId !== scope.organizerId) {
      // If organizer is viewing their own events catalogue
      if (event.status !== 'PUBLISHED') {
        return res.status(403).json({ error: 'Forbidden: You can only view your own events.' });
      }
    }

    res.json(normaliseEvent(event));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// Create event (Organizer/Admin only)
router.post('/', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const {
      title, description, category, venue,
      date, time, totalSeats, targetAudience, status
    } = req.body;

    let collegeId = req.user.collegeId;
    if (!collegeId && req.user.role === 'ORGANIZER') {
      const org = await prisma.organizer.findUnique({ where: { id: req.user.id } });
      collegeId = org?.collegeId || null;
    }

    const event = await prisma.event.create({
      data: {
        title: title || 'Untitled Event',
        description: description || '',
        category: category || 'Technology',
        venue: venue || 'Campus Hall',
        eventDate: date ? new Date(date) : new Date(),
        startTime: time || '10:00 AM',
        endTime: time || '12:00 PM',
        capacity: Number(totalSeats) || 100,
        targetAudience: targetAudience || 'All Students',
        status: status || 'PUBLISHED',
        organizerId: req.user.id,
        collegeId: collegeId
      }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error('[create event error]', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// Update event (Organizer/Admin only)
router.put('/:id', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const existingEvent = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!existingEvent) return res.status(404).json({ error: 'Event not found' });
    
    // Admins can only edit events belonging to their college. Organizers can only edit their own events.
    if (req.user.role === 'ADMIN' && existingEvent.collegeId !== req.user.collegeId) {
      return res.status(403).json({ error: 'Unauthorized to modify events outside your college' });
    }
    if (req.user.role === 'ORGANIZER' && existingEvent.organizerId !== req.user.id) {
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
    
    if (req.user.role === 'ADMIN' && existingEvent.collegeId !== req.user.collegeId) {
      return res.status(403).json({ error: 'Unauthorized to delete events outside your college' });
    }
    if (req.user.role === 'ORGANIZER' && existingEvent.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this event' });
    }

    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

// Get attendees for an event (Organizer/Admin only)
router.get('/:id/attendees', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const event = await prisma.event.findUnique({ where: { id: req.params.id } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (req.user.role === 'ADMIN' && event.collegeId !== req.user.collegeId) {
      return res.status(403).json({ error: 'Unauthorized to view events outside your college' });
    }
    if (req.user.role === 'ORGANIZER' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to view this event' });
    }

    const registrations = await prisma.registration.findMany({
      where: { eventId: req.params.id, status: 'REGISTERED' },
      include: {
        student: { select: { id: true, name: true, email: true, department: true } }
      }
    });

    const attendances = await prisma.attendance.findMany({
      where: { eventId: req.params.id, status: 'PRESENT' }
    });
    
    const presentStudentIds = new Set(attendances.map(a => a.studentId));

    const attendees = registrations.map(reg => ({
      id: reg.student.id,
      name: reg.student.name,
      email: reg.student.email,
      department: reg.student.department,
      registeredAt: reg.registeredAt,
      attendance: presentStudentIds.has(reg.student.id) ? 'PRESENT' : 'ABSENT'
    }));

    res.json(attendees);
  } catch (error) {
    console.error('[get attendees error]', error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
});

// Scan QR Code & Mark Attendance
router.post('/:id/attendance/scan', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { payload } = req.body;
    
    if (!payload) return res.status(400).json({ error: 'QR Payload is required' });

    // Payload expected as: `eventId:studentId` or just `studentId`
    let studentId = payload;
    if (payload.includes(':')) {
      const parts = payload.split(':');
      if (parts[0] !== eventId && parts[0] !== 'event') {
        return res.status(400).json({ error: 'QR Code is for a different event' });
      }
      studentId = parts[1];
    }

    // Verify event ownership
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    if (req.user.role === 'ORGANIZER' && event.organizerId !== req.user.id) {
       return res.status(403).json({ error: 'Unauthorized to scan for this event' });
    }

    // Verify registration
    const registration = await prisma.registration.findFirst({
      where: { eventId, studentId, status: 'REGISTERED' },
      include: { student: true }
    });

    if (!registration) {
      return res.status(400).json({ error: 'Student is not registered or registration is cancelled' });
    }

    // Mark attendance
    await prisma.attendance.upsert({
      where: {
        studentId_eventId: { studentId, eventId }
      },
      update: {
        status: 'PRESENT',
        markedAt: new Date()
      },
      create: {
        studentId,
        eventId,
        status: 'PRESENT'
      }
    });

    res.json({
      success: true,
      studentName: registration.student.name,
      timestamp: new Date().toLocaleTimeString(),
      certificateUrl: `/student/events/${eventId}/certificate`,
      message: 'Attendance marked successfully. Certificate distributed.'
    });

  } catch (error) {
    console.error('[scan]', error);
    res.status(500).json({ error: 'Failed to process QR scan' });
  }
});

const multer = require('multer');
const sharp = require('sharp');

const upload = multer({ storage: multer.memoryStorage() });


// Dispatch Certificates
router.post('/:id/certificates/dispatch', authenticateToken, authorizeRoles('ORGANIZER', 'ADMIN'), upload.single('template'), async (req, res) => {
  try {
    const eventId = req.params.id;
    const { positions, texts } = req.body;
    const templateBuffer = req.file?.buffer;

    if (!templateBuffer || !positions) {
      return res.status(400).json({ error: 'Template image and positions are required' });
    }

    const pos = JSON.parse(positions);
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        college: true,
        attendances: {
          where: { status: 'PRESENT' },
          include: { student: true }
        }
      }
    });

    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (req.user.role === 'ORGANIZER' && event.organizerId !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized to dispatch for this event' });
    }

    const attendances = event.attendances || [];
    if (attendances.length === 0) {
      return res.status(400).json({ error: 'No attendees marked as PRESENT to dispatch to' });
    }

    console.log(`[Email] Starting certificate email generation for event: ${event.title} (${attendances.length} attendees)`);

    const metadata = await sharp(templateBuffer).metadata();
    const width = metadata.width || 1200;
    const height = metadata.height || 800;

    let successCount = 0;
    let failedCount = 0;
    const errors = [];
    const customTexts = texts ? JSON.parse(texts) : {};

    const escapeXml = (unsafe) => {
      return (unsafe || '').toString().replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    for (const attendance of attendances) {
      const student = attendance.student;
      
      const nameX = Math.round((pos.name?.x || 50) / 100 * width);
      const nameY = Math.round((pos.name?.y || 40) / 100 * height);
      
      const titleX = Math.round((pos.title?.x || 50) / 100 * width);
      const titleY = Math.round((pos.title?.y || 65) / 100 * height);
      
      const collegeX = Math.round((pos.college?.x || 50) / 100 * width);
      const collegeY = Math.round((pos.college?.y || 80) / 100 * height);

      const svgText = `
        <svg width="${width}" height="${height}">
          <style>
            .name { font: italic bold 50px serif; fill: #172033; text-anchor: middle; }
            .title { font: bold 24px sans-serif; fill: #172033; text-anchor: middle; text-transform: uppercase; letter-spacing: 2px; }
            .college { font: italic 20px serif; fill: #172033; text-anchor: middle; text-transform: uppercase; letter-spacing: 1px; }
          </style>
          <text x="${nameX}" y="${nameY}" class="name">${escapeXml(student.name)}</text>
          <text x="${titleX}" y="${titleY}" class="title">${escapeXml(customTexts.title || event.title)}</text>
          <text x="${collegeX}" y="${collegeY}" class="college">${escapeXml(customTexts.college || event.college?.name || 'Central College')}</text>
        </svg>
      `;

      const certificateBuffer = await sharp(templateBuffer)
        .composite([{
          input: Buffer.from(svgText),
          top: 0,
          left: 0,
        }])
        .jpeg({ quality: 90 })
        .toBuffer();
        
      console.log(`[Email] Certificate JPG generated for student: ${student.name}`);
      console.log(`[Email] Sending through email API for student: ${student.name}`);

      try {
        const senderEmail = process.env.SMTP_FROM || process.env.SMTP_USER || 'dineshsivakumar9342@gmail.com';
        
        const mailOptions = {
          from: senderEmail,
          to: student.email,
          subject: `Certificate of Participation - ${event.title}`,
          html: `<p>Dear ${student.name},</p><p>Thank you for participating in ${event.title}.</p><p>Please find your certificate attached to this email.</p><br><p>Regards,<br>Campus Events Portal</p>`,
          attachments: [
            {
              filename: `${student.name.replace(/\s+/g, '_')}_Certificate.jpg`,
              content: certificateBuffer,
              contentType: 'image/jpeg'
            }
          ]
        };

        const info = await transporter.sendMail(mailOptions);
        
        console.log(`[Email] Gmail accepted message for student: ${student.name}. MessageId: ${info.messageId}`);
        console.log(`[Email] Certificate email sent successfully for student: ${student.name}`);
        successCount++;
      } catch (e) {
        failedCount++;
        let errorType = 'SMTP Error';
        if (e.code === 'ETIMEDOUT') errorType = 'SMTP network connection problem';
        else if (e.code === 'EAUTH') errorType = 'Gmail authentication/App Password problem';
        else if (e.code === 'ECONNREFUSED') errorType = 'SMTP Connection Refused';
        else if (e.code === 'ENOTFOUND') errorType = 'SMTP hostname/DNS problem';
        
        console.error(`[Email] SMTP request failed for student ${student.id}`);
        console.error(`[Email] Status: ${errorType}`);
        console.error(`[Email] Error Code: ${e.code}`);
        console.error(`[Email] Error Message: ${e.message}`);
        
        const safeErrorMsg = errorType || 'SMTP Connection Error';
        errors.push({ 
          studentId: student.id, 
          email: student.email,
          status: 'failed', 
          type: 'SMTP Error',
          message: safeErrorMsg 
        });
      }
    }

    console.log(`[Email] Dispatch completed. Sent: ${successCount}, Failed: ${failedCount}.`);
    res.json({ 
      success: successCount > 0, 
      sent: successCount, 
      failed: failedCount,
      errors: errors.slice(0, 5) // Return max 5 errors to frontend for safety
    });

  } catch (error) {
    console.error('[certificates/dispatch]', error);
    res.status(500).json({ error: 'Failed to dispatch certificates', details: error.message });
  }
});

module.exports = router;
