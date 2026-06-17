const router = require('express').Router();
const ctrl = require('../controllers/scheduleController');
const authMiddleware = require('../middlewares/authMiddleware');

// Маршруты расписания
router.get('/', ctrl.listSchedules);
router.post('/', authMiddleware, ctrl.createSchedule);
router.post('/:id/copy', authMiddleware, ctrl.copySchedule);

// Маршруты занятий внутри расписания
router.get('/:id/lessons', ctrl.getLessons);
router.post('/:id/lessons', authMiddleware, ctrl.addLesson);
router.put('/:id/lessons/:lid', authMiddleware, ctrl.updateLesson);
router.delete('/:id/lessons/:lid', authMiddleware, ctrl.deleteLesson);

module.exports = router;
