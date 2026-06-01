const express = require('express');
const { readDB, writeDB } = require('../middleware/db');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── Get all queues (with filters) ────────────────────────────────────────
router.get('/queues', verifyAdmin, (req, res) => {
  try {
    const queues = readDB('queue.json');
    const cars = readDB('cars.json');

    const { status, carId, search } = req.query;

    let filtered = queues.map(q => ({
      ...q,
      car: cars.find(c => c.id === q.carId) || null
    }));

    if (status && status !== 'all') {
      filtered = filtered.filter(q => q.status === status);
    }
    if (carId && carId !== 'all') {
      filtered = filtered.filter(q => q.carId === carId);
    }
    if (search && search.trim()) {
      const s = search.toLowerCase().trim();
      filtered = filtered.filter(q =>
        q.userName?.toLowerCase().includes(s) ||
        q.userPhone?.includes(s) ||
        q.carModel?.toLowerCase().includes(s) ||
        String(q.queueNumber).includes(s)
      );
    }

    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── Dashboard stats ────────────────────────────────────────────────────────
router.get('/stats', verifyAdmin, (req, res) => {
  try {
    const queues = readDB('queue.json');
    const users = readDB('users.json');

    const stats = {
      total: queues.length,
      waiting: queues.filter(q => q.status === 'waiting').length,
      confirmed: queues.filter(q => q.status === 'confirmed').length,
      rejected: queues.filter(q => q.status === 'rejected').length,
      completed: queues.filter(q => q.status === 'completed').length,
      cancelled: queues.filter(q => q.status === 'cancelled').length,
      totalUsers: users.filter(u => u.role === 'user').length,
      byModel: {
        onix: queues.filter(q => q.carId === 'onix').length,
        cobalt: queues.filter(q => q.carId === 'cobalt').length,
        damas: queues.filter(q => q.carId === 'damas').length
      }
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── Update queue status ────────────────────────────────────────────────────
router.put('/queue/:id', verifyAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['waiting', 'confirmed', 'rejected', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Noto\'g\'ri status / Неверный статус' });
    }

    const queues = readDB('queue.json');
    const idx = queues.findIndex(q => q.id === req.params.id);
    if (idx === -1) return res.status(404).json({ message: 'Navbat topilmadi' });

    queues[idx].status = status;
    queues[idx].updatedAt = new Date().toISOString();
    writeDB('queue.json', queues);

    res.json(queues[idx]);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── Get all users ──────────────────────────────────────────────────────────
router.get('/users', verifyAdmin, (req, res) => {
  try {
    const users = readDB('users.json');
    const queues = readDB('queue.json');

    const safeUsers = users
      .filter(u => u.role === 'user')
      .map(({ password, ...u }) => ({
        ...u,
        queueCount: queues.filter(q => q.userId === u.id).length
      }));

    res.json(safeUsers);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

module.exports = router;
