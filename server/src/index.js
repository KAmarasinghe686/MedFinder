require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const { seedData } = require('./seed');
const authRoutes = require('./routes/auth');
const pharmacyRoutes = require('./routes/pharmacies');
const medicineRoutes = require('./routes/medicines');
const reservationRoutes = require('./routes/reservations');
const emergencyRoutes = require('./routes/emergency');
const aiRoutes = require('./routes/ai');
const contactRoutes = require('./routes/contact');

const app = express();
const port = process.env.PORT || 4000;

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  })
);

// A 5 MB file becomes roughly 6.7 MB when encoded as a base64 data URL.
app.use(express.json({ limit: '8mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/pharmacies', pharmacyRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/emergency', emergencyRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/contact', contactRoutes);

app.use((error, req, res, next) => {
  if (error?.type === 'entity.too.large') {
    return res.status(413).json({
      message: 'Upload is too large. Prescription and license files must be 5 MB or smaller.',
    });
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ message: 'Invalid JSON request.' });
  }

  return next(error);
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Not found.' });
});

// Start server
const start = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('Missing MONGODB_URI');
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('Missing JWT_SECRET');
    }

    await mongoose.connect(process.env.MONGODB_URI);

    console.log('MongoDB connected successfully');

    await seedData();

    app.listen(port, () => {
      console.log(`MedFinder API running on port ${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

start();
