const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'uzavto-secret-jwt-key-2026';

/**
 * Middleware: verify JWT token for authenticated routes
 */
const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Token topilmadi / Токен не найден' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token yaroqsiz / Токен недействителен' });
  }
};

/**
 * Middleware: verify JWT token AND check admin role
 */
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin huquqi kerak / Требуются права администратора' });
    }
    next();
  });
};

module.exports = { verifyToken, verifyAdmin, JWT_SECRET };
