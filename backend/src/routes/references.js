const router = require('express').Router();
const ctrl = require('../controllers/referencesController');
const authMiddleware = require('../middlewares/authMiddleware');

// Schools
router.get('/schools', ctrl.getSchools);

// Subjects & Curriculum
router.get('/subjects', ctrl.getSubjects);
router.get('/curriculum-subjects', ctrl.getCurriculumSubjects);

// Departments
router.get('/departments', ctrl.getDepartments);
router.post('/departments', authMiddleware, ctrl.createDepartment);
router.delete('/departments/:id', authMiddleware, ctrl.deleteDepartment);

// Teachers
router.get('/teachers', ctrl.getTeachers);
router.post('/teachers', authMiddleware, ctrl.createTeacher);
router.delete('/teachers/:id', authMiddleware, ctrl.deleteTeacher);

// Assignments
router.get('/assignments', ctrl.getTeacherAssignments);

// Buildings
router.get('/buildings', ctrl.getBuildings);

// Rooms
router.get('/rooms', ctrl.getRooms);
router.post('/rooms', authMiddleware, ctrl.createRoom);
router.delete('/rooms/:id', authMiddleware, ctrl.deleteRoom);

// Academic Groups
router.get('/academic-groups', ctrl.getAcademicGroups);

// Study Groups
router.get('/groups', ctrl.getStudyGroups);
router.post('/groups', authMiddleware, ctrl.createStudyGroup);
router.delete('/groups/:id', authMiddleware, ctrl.deleteStudyGroup);

module.exports = router;
