const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const queueRoutes = require('./routes/queue');
const carsRoutes = require('./routes/cars');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS ──────────────────────────────────────────────────
// In production (Vercel) frontend & backend are same origin → allow all
const corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: true, credentials: true }
  : {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://127.0.0.1:5173'
      ],
      credentials: true
    };

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger (dev only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toLocaleTimeString()} [${req.method}] ${req.path}`);
    next();
  });
}

// ─── Routes ────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    server: 'UzAvto API',
    env: process.env.NODE_ENV || 'development',
    time: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint topilmadi' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server xatosi' });
});

// ─── Listen (local dev only) ───────────────────────────────
// On Vercel, the module is imported and app is exported below.
// app.listen() must NOT be called in serverless context.
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('');
    console.log('  🚗 UzAvto Online Navbat Tizimi');
    console.log('  ================================');
    console.log(`  🚀 Server: http://localhost:${PORT}`);
    console.log(`  📡 API:    http://localhost:${PORT}/api`);
    console.log('');
    console.log('  💡 Admin yaratish: POST /api/auth/setup-admin');
    console.log('');
  });
}

// ─── Export for Vercel Serverless ─────────────────────────
module.exports = app;
