const prisma = require('../prismaClient');
const { checkConflicts } = require('../services/conflictChecker');

// Получить все расписания
async function listSchedules(req, res) {
  try {
    const schedules = await prisma.schedule.findMany({
      orderBy: { created_at: 'desc' }
    });
    res.json(schedules);
  } catch (error) {
    console.error('Ошибка при получении расписаний:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Создать новое расписание
async function createSchedule(req, res) {
  try {
    const { 
      schedule_name, 
      curriculum_id, 
      academic_year, 
      semester_number, 
      date_start, 
      date_end, 
      week_count, 
      is_active 
    } = req.body;
    
    // Если новое расписание активно, деактивируем остальные
    if (is_active) {
      await prisma.schedule.updateMany({
        where: { is_active: true },
        data: { is_active: false }
      });
    }

    const schedule = await prisma.schedule.create({
      data: {
        schedule_name,
        curriculum_id,
        academic_year,
        semester_number,
        date_start: new Date(date_start),
        date_end: new Date(date_end),
        week_count,
        is_active: is_active || false
      }
    });
    
    res.status(201).json(schedule);
  } catch (error) {
    console.error('Ошибка при создании расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера при создании расписания' });
  }
}

// Получить занятия для конкретного расписания
async function getLessons(req, res) {
  try {
    const { id } = req.params;
    const lessons = await prisma.lesson.findMany({
      where: { schedule_id: parseInt(id) },
      include: {
        study_group: true,
        curriculum_subject: { include: { subject: true } },
        teacher_assignment: { include: { teacher: true } },
        room: { include: { building: true } }
      }
    });
    res.json(lessons);
  } catch (error) {
    console.error('Ошибка при получении занятий:', error);
    res.status(500).json({ error: 'Ошибка сервера' });
  }
}

// Добавить занятие в расписание
async function addLesson(req, res) {
  try {
    const { id } = req.params;
    const {
      study_group_id,
      subj_id,
      assignment_id,
      room_id,
      lesson_type,
      day_of_week,
      slot_id,
      specific_date,
      is_recurring,
      week_parity
    } = req.body;

    // Вызов проверки конфликтов
    const conflicts = await checkConflicts({
      schedule_id: parseInt(id),
      study_group_id,
      subj_id,
      assignment_id,
      room_id,
      lesson_type,
      day_of_week,
      slot_id,
      specific_date,
      is_recurring: is_recurring !== undefined ? is_recurring : true,
      week_parity
    });

    if (conflicts.length > 0) {
      return res.status(422).json({ conflicts });
    }

    const lesson = await prisma.lesson.create({
      data: {
        schedule_id: parseInt(id),
        study_group_id,
        subj_id,
        assignment_id,
        room_id,
        lesson_type,
        day_of_week,
        slot_id,
        specific_date: specific_date ? new Date(specific_date) : null,
        is_recurring: is_recurring !== undefined ? is_recurring : true,
        week_parity: week_parity || "BOTH"
      },
      include: {
        study_group: true,
        curriculum_subject: { include: { subject: true } },
        teacher_assignment: { include: { teacher: true } },
        room: { include: { building: true } }
      }
    });

    res.status(201).json({ message: 'Занятие успешно добавлено', lesson });
  } catch (error) {
    console.error('Ошибка при добавлении занятия:', error);
    res.status(500).json({ error: 'Ошибка сервера при добавлении занятия' });
  }
}

// Обновить занятие
async function updateLesson(req, res) {
  try {
    const { id, lid } = req.params;
    const {
      study_group_id,
      subj_id,
      assignment_id,
      room_id,
      lesson_type,
      day_of_week,
      slot_id,
      specific_date,
      is_recurring,
      week_parity
    } = req.body;

    const conflicts = await checkConflicts({
      schedule_id: parseInt(id),
      study_group_id,
      subj_id,
      assignment_id,
      room_id,
      lesson_type,
      day_of_week,
      slot_id,
      specific_date,
      is_recurring: is_recurring !== undefined ? is_recurring : true,
      week_parity,
      exclude_lesson_id: parseInt(lid)
    });

    if (conflicts.length > 0) {
      return res.status(422).json({ conflicts });
    }

    const updatedLesson = await prisma.lesson.update({
      where: { lesson_id: parseInt(lid) },
      data: {
        study_group_id,
        subj_id,
        assignment_id,
        room_id,
        lesson_type,
        day_of_week,
        slot_id,
        specific_date: specific_date ? new Date(specific_date) : null,
        is_recurring: is_recurring !== undefined ? is_recurring : true,
        week_parity: week_parity || "BOTH"
      },
      include: {
        study_group: true,
        curriculum_subject: { include: { subject: true } },
        teacher_assignment: { include: { teacher: true } },
        room: { include: { building: true } }
      }
    });

    res.json({ message: 'Занятие успешно обновлено', lesson: updatedLesson });
  } catch (error) {
    console.error('Ошибка при обновлении занятия:', error);
    res.status(500).json({ error: 'Ошибка сервера при обновлении занятия' });
  }
}

// Удалить занятие
async function deleteLesson(req, res) {
  try {
    const { lid } = req.params;
    await prisma.lesson.delete({
      where: { lesson_id: parseInt(lid) }
    });
    res.status(204).send();
  } catch (error) {
    console.error('Ошибка при удалении занятия:', error);
    res.status(500).json({ error: 'Ошибка сервера при удалении занятия' });
  }
}

// Копировать расписание
async function copySchedule(req, res) {
  try {
    const { id } = req.params;
    const { schedule_name, academic_year, semester_number } = req.body;

    const sourceSchedule = await prisma.schedule.findUnique({
      where: { schedule_id: parseInt(id) }
    });

    if (!sourceSchedule) {
      return res.status(404).json({ error: 'Исходное расписание не найдено' });
    }

    // Создаем новое расписание
    const newSchedule = await prisma.schedule.create({
      data: {
        schedule_name: schedule_name || `Копия ${sourceSchedule.schedule_name}`,
        curriculum_id: sourceSchedule.curriculum_id,
        academic_year: academic_year || sourceSchedule.academic_year,
        semester_number: semester_number || sourceSchedule.semester_number,
        date_start: sourceSchedule.date_start,
        date_end: sourceSchedule.date_end,
        week_count: sourceSchedule.week_count,
        is_active: false,
        copied_from_id: sourceSchedule.schedule_id
      }
    });

    // Копируем все регулярные занятия
    const sourceLessons = await prisma.lesson.findMany({
      where: { 
        schedule_id: parseInt(id),
        is_recurring: true
      }
    });

    if (sourceLessons.length > 0) {
      const newLessonsData = sourceLessons.map(l => ({
        schedule_id: newSchedule.schedule_id,
        study_group_id: l.study_group_id,
        subj_id: l.subj_id,
        assignment_id: l.assignment_id,
        room_id: l.room_id,
        lesson_type: l.lesson_type,
        day_of_week: l.day_of_week,
        slot_id: l.slot_id,
        is_recurring: true,
        week_parity: l.week_parity,
        location_type: l.location_type
      }));

      await prisma.lesson.createMany({
        data: newLessonsData
      });
    }

    res.status(201).json({ message: 'Расписание скопировано', schedule: newSchedule });
  } catch (error) {
    console.error('Ошибка при копировании расписания:', error);
    res.status(500).json({ error: 'Ошибка сервера при копировании' });
  }
}

module.exports = {
  listSchedules,
  createSchedule,
  getLessons,
  addLesson,
  updateLesson,
  deleteLesson,
  copySchedule
};
