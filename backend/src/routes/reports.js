const router = require('express').Router();
const ctrl = require('../controllers/reportsController');

// Роуты отчетов, требующие :scheduleId
router.get('/room-load/:scheduleId', ctrl.getRoomLoad);
router.get('/teacher-load/:scheduleId', ctrl.getTeacherLoadSummary);
router.get('/exams/:scheduleId', ctrl.getExamsSchedule);

module.exports = router;
