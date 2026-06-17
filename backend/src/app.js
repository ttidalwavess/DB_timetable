const express = require('express');
const cors = require('cors');
require('dotenv').config();

const prisma = require('./prismaClient');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const scheduleRouter = require('./routes/schedule');
const referencesRouter = require('./routes/references');
const authRouter = require('./routes/auth');
const reportsRouter = require('./routes/reports');

// Базовый маршрут API
app.use('/api/auth', authRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/refs', referencesRouter);
app.use('/api/reports', reportsRouter);

app.get('/api/test', async (req, res) => {
    try {
        // Пробуем достать данные из таблицы school (факультеты)
        const schools = await prisma.school.findMany();
        res.json({
            message: 'Бэкенд успешно подключен к PostgreSQL через Prisma!',
            schoolsCount: schools.length,
            schools: schools
        });
    } catch (error) {
        console.error('Ошибка при обращении к БД:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});
