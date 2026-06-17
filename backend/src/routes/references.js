const router = require('express').Router();
const ctrl = require('../controllers/referencesController');
const authMiddleware = require('../middlewares/authMiddleware');

// Departments
router.get('/departments', ctrl.getDepartments);
router.post('/departments', authMiddleware, ctrl.createDepartment);
router.delete('/departments/:id', authMiddleware, ctrl.deleteDepartment);

// Teachers
router.get('/teachers', ctrl.getTeachers);
router.post('/teachers', authMiddleware, ctrl.createTeacher);
router.delete('/teachers/:id', authMiddleware, ctrl.deleteTeacher);

// Rooms
router.get('/rooms', ctrl.getRooms);
router.post('/rooms', authMiddleware, ctrl.createRoom);
router.delete('/rooms/:id', authMiddleware, ctrl.deleteRoom);

// Study Groups
router.get('/groups', ctrl.getStudyGroups);
router.post('/groups', authMiddleware, ctrl.createStudyGroup);
router.delete('/groups/:id', authMiddleware, ctrl.deleteStudyGroup);

module.exports = router;
