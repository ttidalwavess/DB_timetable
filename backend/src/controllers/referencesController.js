const prisma = require('../prismaClient');

// --- Departments (Подразделения) ---

async function getDepartments(req, res) {
  try {
    const departments = await prisma.department.findMany({
      include: { school: true }
    });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function createDepartment(req, res) {
  try {
    const { department_name, school_id } = req.body;
    const department = await prisma.department.create({
      data: { department_name, school_id }
    });
    res.status(201).json(department);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при создании' });
  }
}

async function deleteDepartment(req, res) {
  try {
    const { id } = req.params;
    await prisma.department.delete({ where: { department_id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
}

// --- Teachers (Преподаватели) ---

async function getTeachers(req, res) {
  try {
    const teachers = await prisma.teacher.findMany({
      include: { department: true }
    });
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function createTeacher(req, res) {
  try {
    const { first_name, last_name, middle_name, department_id, position, academic_degree, academic_rank } = req.body;
    const teacher = await prisma.teacher.create({
      data: { 
        first_name, 
        last_name, 
        middle_name, 
        department_id: parseInt(department_id), 
        position: position || 'Преподаватель',
        academic_degree,
        academic_rank
      }
    });
    res.status(201).json(teacher);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка сервера при создании' });
  }
}

async function deleteTeacher(req, res) {
  try {
    const { id } = req.params;
    await prisma.teacher.delete({ where: { teacher_id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
}

// --- Rooms (Помещения) ---

async function getRooms(req, res) {
  try {
    const rooms = await prisma.room.findMany({
      include: { building: true }
    });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function createRoom(req, res) {
  try {
    const { room_number, room_type, capacity, building_id, is_online } = req.body;
    const room = await prisma.room.create({
      data: { room_number, room_type, capacity, building_id, is_online: is_online || false }
    });
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при создании' });
  }
}

async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    await prisma.room.delete({ where: { room_id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
}

// --- Study Groups (Учебные группы) ---

async function getStudyGroups(req, res) {
  try {
    const groups = await prisma.study_group.findMany({
      include: { academic_group: true }
    });
    res.json(groups);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

async function createStudyGroup(req, res) {
  try {
    const { study_group_name, group_type, student_count, academic_group_id } = req.body;
    const group = await prisma.study_group.create({
      data: { study_group_name, group_type, student_count, academic_group_id }
    });
    res.status(201).json(group);
  } catch (error) {
    res.status(500).json({ error: 'Ошибка сервера при создании' });
  }
}

async function deleteStudyGroup(req, res) {
  try {
    const { id } = req.params;
    await prisma.study_group.delete({ where: { study_group_id: parseInt(id) } });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Ошибка удаления' });
  }
}

module.exports = {
  getDepartments, createDepartment, deleteDepartment,
  getTeachers, createTeacher, deleteTeacher,
  getRooms, createRoom, deleteRoom,
  getStudyGroups, createStudyGroup, deleteStudyGroup
};
