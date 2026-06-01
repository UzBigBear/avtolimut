const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const queueRoutes = require('./routes/queue');
const carsRoutes = require('./routes/cars');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, res, next) => {
  console.log(`${new Date().toLocaleTimeString()} [${req.method}] ${req.path}`);
  next();
});

// ─── Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/cars', carsRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', server: 'UzAvto API', time: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint topilmadi / Endpoint не найден' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Server xatosi / Ошибка сервера' });
});

// ─── Start ─────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('  🚗 UzAvto Online Navbat Tizimi');
  console.log('  ================================');
  console.log(`  🚀 Server: http://localhost:${PORT}`);
  console.log(`  📡 API:    http://localhost:${PORT}/api`);
  console.log('');
  console.log('  💡 Admin yaratish uchun:');
  console.log(`     POST http://localhost:${PORT}/api/auth/setup-admin`);
  console.log('');
});
