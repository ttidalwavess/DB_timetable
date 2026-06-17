const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

function authMiddleware(req, res, next) {
  // Получаем токен из заголовка Authorization
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Доступ запрещен. Нет токена авторизации.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Проверяем валидность токена
    const decoded = jwt.verify(token, JWT_SECRET);
    // Добавляем данные пользователя в объект запроса
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Недействительный или истекший токен.' });
  }
}

module.exports = authMiddleware;
