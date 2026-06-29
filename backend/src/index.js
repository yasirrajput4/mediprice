require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { connectDB } = require('./config/db');
const { connectRedis } = require('./config/redis');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const hospitalRoutes = require('./routes/hospitals');
const serviceRoutes = require('./routes/services');
const bookingRoutes = require('./routes/bookings');
const paymentRoutes = require('./routes/payments');
const adminRoutes = require('./routes/admin');

const { errorHandler, notFound } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 4000;

// ── Security & Utilities ────────────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://mediprice.in']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));

// ── Body Parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Global Rate Limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', globalLimiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Startup ───────────────────────────────────────────────────────────────────
async function start() {
  try {
    await connectDB();
    await connectRedis();
    logger.info('Connected to PostgreSQL and Redis');

    app.listen(PORT, () => {
      logger.info(`MediPrice API running on port ${PORT}`);
    });
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}

start();
