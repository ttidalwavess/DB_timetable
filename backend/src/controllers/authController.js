const jwt = require('jsonwebtoken');

// В реальном проекте здесь будет обращение к базе данных и bcrypt.compare
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'admin123';
const JWT_SECRET = process.env.JWT_SECRET || 'secret';

async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // Генерируем токен на 24 часа
      const token = jwt.sign(
        { username, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      return res.json({ message: 'Успешная авторизация', token });
    }

    return res.status(401).json({ error: 'Неверный логин или пароль' });
  } catch (error) {
    console.error('Ошибка при логине:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = {
  login
};
