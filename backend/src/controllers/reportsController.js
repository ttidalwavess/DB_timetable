const prisma = require('../prismaClient');

// Загрузка помещений (Шахматка)
async function getRoomLoad(req, res) {
  try {
    const { scheduleId } = req.params;
    
    const rooms = await prisma.room.findMany({
      include: { building: true }
    });
    
    const lessons = await prisma.lesson.findMany({
      where: { 
        schedule_id: parseInt(scheduleId),
        is_recurring: true 
      },
      include: {
        study_group: true,
        curriculum_subject: { include: { subject: true } },
        teacher_assignment: { include: { teacher: true } }
      }
    });

    const result = {};
    
    rooms.forEach(room => {
      result[room.room_id] = {
        room,
        building: room.building,
        typeLabel: room.room_type,
        grid: {}
      };
    });

    lessons.forEach(l => {
      if (!l.room_id || !result[l.room_id]) return;
      const key = `${l.day_of_week}_${l.slot_id}`;
      if (!result[l.room_id].grid[key]) result[l.room_id].grid[key] = [];
      
      result[l.room_id].grid[key].push({
        ...l,
        teacherShort: l.teacher_assignment?.teacher ? 
          `${l.teacher_assignment.teacher.last_name} ${l.teacher_assignment.teacher.first_name[0]}.${l.teacher_assignment.teacher.middle_name ? l.teacher_assignment.teacher.middle_name[0] + '.' : ''}` : "—",
        subjectName: l.curriculum_subject?.subject?.subject_name || "—",
        groupName: l.study_group?.study_group_name || "—"
      });
    });

    res.json(result);
  } catch (error) {
    console.error('Ошибка в getRoomLoad:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Сводная загрузка преподавателей
async function getTeacherLoadSummary(req, res) {
  try {
    const { scheduleId } = req.params;
    
    const teachers = await prisma.teacher.findMany();
    const assignments = await prisma.teacher_assignment.findMany();
    
    const lessons = await prisma.lesson.findMany({
      where: { 
        schedule_id: parseInt(scheduleId),
        is_recurring: true
      },
      include: {
        curriculum_subject: { include: { subject: true } },
        teacher_assignment: true,
        study_group: true,
        room: { include: { building: true } }
      }
    });

    const result = teachers.map(teacher => {
      const teacherAssignments = assignments.filter(a => a.teacher_id === teacher.teacher_id);
      const assignmentIds = teacherAssignments.map(a => a.assignment_id);
      
      const teacherLessons = lessons.filter(l => assignmentIds.includes(l.assignment_id));
      
      const byDay = {};
      [1, 2, 3, 4, 5, 6].forEach(d => {
        byDay[d] = teacherLessons.filter(l => l.day_of_week === d).length;
      });
      const maxPerDay = Math.max(0, ...Object.values(byDay));

      const bySubject = {};
      teacherLessons.forEach(l => {
        const key = l.curriculum_subject?.subject?.subject_name || "—";
        if (!bySubject[key]) bySubject[key] = { name: key, LEC: 0, PRAC: 0, LAB: 0, total: 0 };
        bySubject[key][l.lesson_type] = (bySubject[key][l.lesson_type] || 0) + 1;
        bySubject[key].total++;
      });

      return {
        teacher,
        shortName: `${teacher.last_name} ${teacher.first_name[0]}.${teacher.middle_name ? teacher.middle_name[0] + '.' : ''}`,
        total: teacherLessons.length,
        maxPerDay,
        overLimit: maxPerDay > 5, // лимит 5 пар в день
        byDay,
        bySubject: Object.values(bySubject),
        lessons: teacherLessons.map(l => ({
          ...l,
          subjectName: l.curriculum_subject?.subject?.subject_name || "—",
          groupName: l.study_group?.study_group_name || "—",
          roomLabel: l.room ? `${l.room.building?.building_name} — ${l.room.room_number}` : "—"
        }))
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Ошибка в getTeacherLoadSummary:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Расписание сессии (Экзамены и зачеты)
async function getExamsSchedule(req, res) {
  try {
    const { scheduleId } = req.params;
    
    const lessons = await prisma.lesson.findMany({
      where: { 
        schedule_id: parseInt(scheduleId),
        lesson_type: { in: ['EXAM', 'CREDIT'] }
      },
      include: {
        study_group: true,
        curriculum_subject: { include: { subject: true } },
        teacher_assignment: { include: { teacher: true } },
        room: { include: { building: true } }
      },
      orderBy: { specific_date: 'asc' }
    });

    const enriched = lessons.map(l => ({
      ...l,
      teacherShort: l.teacher_assignment?.teacher ? 
          `${l.teacher_assignment.teacher.last_name} ${l.teacher_assignment.teacher.first_name[0]}.${l.teacher_assignment.teacher.middle_name ? l.teacher_assignment.teacher.middle_name[0] + '.' : ''}` : "—",
      subjectName: l.curriculum_subject?.subject?.subject_name || "—",
      groupName: l.study_group?.study_group_name || "—",
      roomLabel: l.room ? `${l.room.building?.building_name} — ${l.room.room_number}` : "—"
    }));

    res.json(enriched);
  } catch (error) {
    console.error('Ошибка в getExamsSchedule:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

module.exports = {
  getRoomLoad,
  getTeacherLoadSummary,
  getExamsSchedule
};
