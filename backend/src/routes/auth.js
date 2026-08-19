const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { authenticateToken } = require('../middleware/auth');
const prisma = require('../db');

const router = express.Router();

// Helper to generate token
const generateToken = (id, role) => {
  return jwt.sign({ id, userId: id, role }, process.env.JWT_SECRET, { expiresIn: '24h' });
};

// --- STUDENT AUTH ---
router.post('/student/register', async (req, res) => {
  const { name, email, password, department, year } = req.body;
  try {
    const existing = await prisma.student.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.student.create({
      data: {
        name, email, password: hashedPassword,
        department: department || 'General', year: year || 1
      }
    });

    const token = generateToken(user.id, 'STUDENT');
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: { ...userWithoutPassword, role: 'STUDENT' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register student' });
  }
});

router.post('/student/login', async (req, res) => {
  const { email, password } = req.body;
  console.log(`Login attempt for email: '${email}', password: '${password}'`);
  try {
    const user = await prisma.student.findUnique({ where: { email } });
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log('Password valid:', validPassword);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id, 'STUDENT');
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: { ...userWithoutPassword, role: 'STUDENT' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// --- ORGANIZER AUTH ---
router.post('/organizer/register', async (req, res) => {
  const { name, email, password, department, organizationName } = req.body;
  try {
    const existing = await prisma.organizer.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.organizer.create({
      data: {
        name, email, password: hashedPassword,
        department: department || 'General', organizationName: organizationName || 'N/A'
      }
    });

    const token = generateToken(user.id, 'ORGANIZER');
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'ORGANIZER' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to register organizer' });
  }
});

router.post('/organizer/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.organizer.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id, 'ORGANIZER');
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: 'ORGANIZER' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

// --- ADMIN AUTH ---
router.post('/admin/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.admin.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

    const token = generateToken(user.id, 'ADMIN');
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: { ...userWithoutPassword, role: 'ADMIN' } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { id, role } = req.user;
    let user;
    if (role === 'STUDENT') {
      user = await prisma.student.findUnique({ where: { id } });
    } else if (role === 'ORGANIZER') {
      user = await prisma.organizer.findUnique({ where: { id } });
    } else if (role === 'ADMIN') {
      user = await prisma.admin.findUnique({ where: { id } });
    }
    
    if (user) delete user.password;

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { ...user, role } });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

module.exports = router;
