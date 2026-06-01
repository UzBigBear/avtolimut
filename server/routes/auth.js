const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { readDB, writeDB } = require('../middleware/db');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ─── Register ──────────────────────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Barcha maydonlarni to\'ldiring / Заполните все поля' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'Parol kamida 6 ta belgidan iborat bo\'lishi kerak' });
    }

    const users = readDB('users.json');
    if (users.find(u => u.phone === phone)) {
      return res.status(409).json({ message: 'Bu telefon raqam allaqachon ro\'yxatdan o\'tgan / Номер телефона уже зарегистрирован' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      id: uuidv4(),
      name: name.trim(),
      phone: phone.trim(),
      password: hashedPassword,
      role: 'user',
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    writeDB('users.json', users);

    const token = jwt.sign(
      { id: newUser.id, name: newUser.name, phone: newUser.phone, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: { id: newUser.id, name: newUser.name, phone: newUser.phone, role: newUser.role }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Server xatosi / Ошибка сервера' });
  }
});

// ─── Login ─────────────────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ message: 'Telefon va parolni kiriting / Введите телефон и пароль' });
    }

    const users = readDB('users.json');
    const user = users.find(u => u.phone === phone.trim());

    if (!user) {
      return res.status(401).json({ message: 'Telefon raqam yoki parol noto\'g\'ri / Неверный номер телефона или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Telefon raqam yoki parol noto\'g\'ri / Неверный номер телефона или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, phone: user.phone, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, phone: user.phone, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server xatosi / Ошибка сервера' });
  }
});

// ─── Setup Admin (only if no admin exists) ────────────────────────────────
router.post('/setup-admin', async (req, res) => {
  try {
    const users = readDB('users.json');
    if (users.find(u => u.role === 'admin')) {
      return res.status(409).json({ message: 'Admin allaqachon mavjud / Администратор уже существует' });
    }

    const hashedPassword = await bcrypt.hash('Admin@2026', 10);
    const admin = {
      id: uuidv4(),
      name: 'UzAvto Admin',
      phone: '+998901234567',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    };

    users.push(admin);
    writeDB('users.json', users);

    res.json({
      message: 'Admin muvaffaqiyatli yaratildi',
      credentials: { phone: '+998901234567', password: 'Admin@2026' }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server xatosi' });
  }
});

// ─── Get current user info ─────────────────────────────────────────────────
router.get('/me', require('../middleware/auth').verifyToken, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
