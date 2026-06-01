const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../middleware/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

// ─── Get my queues ─────────────────────────────────────────────────────────
router.get('/my', verifyToken, (req, res) => {
  try {
    const queues = readDB('queue.json');
    const cars = readDB('cars.json');

    const myQueues = queues
      .filter(q => q.userId === req.user.id)
      .map(q => ({ ...q, car: cars.find(c => c.id === q.carId) || null }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.json(myQueues);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── Book a queue ──────────────────────────────────────────────────────────
router.post('/book', verifyToken, (req, res) => {
  try {
    const { carId, colorValue, paymentType, notes } = req.body;

    if (!carId || !colorValue || !paymentType) {
      return res.status(400).json({ message: 'Barcha maydonlarni to\'ldiring / Заполните все поля' });
    }

    const cars = readDB('cars.json');
    const car = cars.find(c => c.id === carId);
    if (!car) return res.status(404).json({ message: 'Mashina topilmadi' });

    const color = car.colors.find(c => c.value === colorValue);
    if (!color) return res.status(400).json({ message: 'Rang topilmadi' });

    const queues = readDB('queue.json');

    // Prevent duplicate active queue for same car
    const existingActiveQueue = queues.find(
      q => q.userId === req.user.id && q.carId === carId && ['waiting', 'confirmed'].includes(q.status)
    );
    if (existingActiveQueue) {
      return res.status(409).json({
        message: 'Bu mashina uchun allaqachon aktiv navbatdasiz / У вас уже есть активная очередь на этот автомобиль'
      });
    }

    // Generate queue number per car model
    const carQueues = queues.filter(q => q.carId === carId);
    const queueNumber = carQueues.length + 1;

    const newQueue = {
      id: uuidv4(),
      userId: req.user.id,
      userName: req.user.name,
      userPhone: req.user.phone,
      carId,
      carModel: car.model,
      color,
      paymentType,
      notes: (notes || '').trim(),
      status: 'waiting',
      queueNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    queues.push(newQueue);
    writeDB('queue.json', queues);

    res.status(201).json({ ...newQueue, car });
  } catch (err) {
    console.error('Book queue error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── Cancel my queue ────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, (req, res) => {
  try {
    const queues = readDB('queue.json');
    const idx = queues.findIndex(q => q.id === req.params.id && q.userId === req.user.id);

    if (idx === -1) return res.status(404).json({ message: 'Navbat topilmadi' });
    if (queues[idx].status !== 'waiting') {
      return res.status(400).json({ message: 'Faqat kutayotgan navbatni bekor qilish mumkin' });
    }

    queues[idx].status = 'cancelled';
    queues[idx].updatedAt = new Date().toISOString();
    writeDB('queue.json', queues);

    res.json({ message: 'Navbat bekor qilindi' });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

module.exports = router;
