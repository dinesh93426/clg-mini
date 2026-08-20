const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes           = require('./routes/auth');
const eventRoutes          = require('./routes/events');
const registrationRoutes   = require('./routes/registrations');
const adminAnalyticsRoutes = require('./routes/adminAnalytics');
const organizerRoutes      = require('./routes/organizerAnalytics');
const recommendationRoutes = require('./routes/recommendations');
const aiRoutes             = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://clg-mini.vercel.app'
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Existing routes (do not modify)
app.use('/api/auth',   authRoutes);
app.use('/auth',       authRoutes);
app.use('/api/events', eventRoutes);
app.use('/events',     eventRoutes);

// Registration / attendance / feedback
app.use('/api', registrationRoutes);

// AI routes
app.use('/api/ai', aiRoutes);

// Student recommendations
app.use('/api/students', recommendationRoutes);

// Admin analytics
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin',           adminAnalyticsRoutes);   // /api/admin/organizers

// Organizer analytics
app.use('/api/organizer/analytics', organizerRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'EventIntel AI Backend API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      events: '/api/events',
      ai: '/api/ai',
      analytics: '/api/admin/analytics'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'college-events-api' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Trigger nodemon restart
