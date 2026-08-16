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

app.use(cors());
app.use(express.json());

// Existing routes (do not modify)
app.use('/api/auth',   authRoutes);
app.use('/api/events', eventRoutes);

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

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'college-events-api' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Trigger nodemon restart
