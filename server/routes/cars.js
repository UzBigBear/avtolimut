const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../middleware/db');
const { verifyAdmin } = require('../middleware/auth');

const router = express.Router();

// ─── GET all cars (public) ─────────────────────────────────
router.get('/', (req, res) => {
  try {
    const cars = readDB('cars.json');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── GET single car (public) ───────────────────────────────
router.get('/:id', (req, res) => {
  try {
    const cars = readDB('cars.json');
    const car = cars.find(c => c.id === req.params.id);
    if (!car) return res.status(404).json({ message: 'Mashina topilmadi' });
    res.json(car);
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── CREATE car (Admin) ────────────────────────────────────
router.post('/', verifyAdmin, (req, res) => {
  try {
    const {
      id, model, year, price, colors,
      availableCount, waitingMonthsMin, waitingMonthsMax,
      description_uz, description_ru
    } = req.body;

    if (!model || !price || !colors || !Array.isArray(colors) || colors.length === 0) {
      return res.status(400).json({ message: 'Model, narx va ranglar majburiy' });
    }

    const cars = readDB('cars.json');

    const carId = id || model.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    if (cars.find(c => c.id === carId)) {
      return res.status(409).json({ message: 'Bu ID bilan mashina allaqachon mavjud' });
    }

    const newCar = {
      id: carId,
      model,
      year: Number(year) || new Date().getFullYear(),
      price: Number(price),
      colors,
      availableCount: Number(availableCount) || 0,
      waitingMonthsMin: Number(waitingMonthsMin) || 1,
      waitingMonthsMax: Number(waitingMonthsMax) || 3,
      description_uz: description_uz || '',
      description_ru: description_ru || ''
    };

    cars.push(newCar);
    writeDB('cars.json', cars);

    res.status(201).json(newCar);
  } catch (err) {
    console.error('Create car error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── UPDATE car (Admin) ────────────────────────────────────
router.put('/:id', verifyAdmin, (req, res) => {
  try {
    const cars = readDB('cars.json');
    const idx = cars.findIndex(c => c.id === req.params.id);

    if (idx === -1) return res.status(404).json({ message: 'Mashina topilmadi' });

    const {
      model, year, price, colors,
      availableCount, waitingMonthsMin, waitingMonthsMax,
      description_uz, description_ru
    } = req.body;

    cars[idx] = {
      ...cars[idx],
      model:           model           ?? cars[idx].model,
      year:            year            ? Number(year)            : cars[idx].year,
      price:           price           ? Number(price)           : cars[idx].price,
      colors:          Array.isArray(colors) && colors.length ? colors : cars[idx].colors,
      availableCount:  availableCount  !== undefined ? Number(availableCount)  : cars[idx].availableCount,
      waitingMonthsMin: waitingMonthsMin !== undefined ? Number(waitingMonthsMin) : cars[idx].waitingMonthsMin,
      waitingMonthsMax: waitingMonthsMax !== undefined ? Number(waitingMonthsMax) : cars[idx].waitingMonthsMax,
      description_uz:  description_uz  ?? cars[idx].description_uz,
      description_ru:  description_ru  ?? cars[idx].description_ru,
    };

    writeDB('cars.json', cars);
    res.json(cars[idx]);
  } catch (err) {
    console.error('Update car error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── DELETE car (Admin) ────────────────────────────────────
router.delete('/:id', verifyAdmin, (req, res) => {
  try {
    const cars = readDB('cars.json');
    const idx = cars.findIndex(c => c.id === req.params.id);

    if (idx === -1) return res.status(404).json({ message: 'Mashina topilmadi' });

    // Check if there are active queues for this car
    const queues = readDB('queue.json');
    const activeQueues = queues.filter(
      q => q.carId === req.params.id && ['waiting', 'confirmed'].includes(q.status)
    );
    if (activeQueues.length > 0) {
      return res.status(400).json({
        message: `Bu mashina uchun ${activeQueues.length} ta aktiv navbat mavjud. Avval navbatlarni yoping.`
      });
    }

    const deleted = cars.splice(idx, 1)[0];
    writeDB('cars.json', cars);

    res.json({ message: 'Mashina o\'chirildi', deleted });
  } catch (err) {
    console.error('Delete car error:', err);
    res.status(500).json({ message: 'Server xatosi' });
  }
});

module.exports = router;
