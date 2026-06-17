const prisma = require('../prismaClient');

// Вспомогательная функция проверки пересечения недель
function weekParityOverlaps(parity1, parity2) {
  if (!parity1 || !parity2) return true;
  if (parity1 === "BOTH" || parity2 === "BOTH") return true;
  return parity1 === parity2;
}

// Константы времени перерывов между парами (в минутах)
const SLOT_BREAKS = {
  2: 10,  // между 1 и 2 парой
  3: 10,  // между 2 и 3 парой
  4: 10,  // между 3 и 4 парой
  5: 10,  // между 4 и 5 парой
  6: 10,  // между 5 и 6 парой
  7: 10,
  8: 10
};

/**
 * Проверяет новое занятие на все ограничения.
 * Возвращает массив нарушений (пустой — если всё чисто).
 */
async function checkConflicts(lessonData) {
  const errors = [];
  const { 
    schedule_id, study_group_id, assignment_id, room_id, day_of_week, slot_id,
    lesson_type, specific_date, is_recurring, week_parity = "BOTH",
    exclude_lesson_id
  } = lessonData;

  // Если это не регулярное занятие, пропускаем часть проверок 
  // (но в идеале их нужно адаптировать под specific_date)
  if (!is_recurring) return errors;

  // Получаем все регулярные занятия для данного расписания, дня недели и слота
  let existingLessons = await prisma.lesson.findMany({
    where: {
      schedule_id,
      day_of_week,
      slot_id,
      is_recurring: true
    },
    include: {
      study_group: true,
      teacher_assignment: true,
      room: true
    }
  });

  if (exclude_lesson_id) {
    existingLessons = existingLessons.filter(l => l.lesson_id !== exclude_lesson_id);
  }

  // Отфильтруем те, которые пересекаются по неделям
  const overlappingLessons = existingLessons.filter(l => 
    weekParityOverlaps(l.week_parity, week_parity)
  );

  // 1. Группа не может быть в двух местах одновременно
  const groupConflict = overlappingLessons.find(l => l.study_group_id === study_group_id);
  if (groupConflict) {
    errors.push("Группа уже занята в это время");
  }

  // 2. Преподаватель не может вести два занятия одновременно
  if (assignment_id) {
    const currentAssignment = await prisma.teacher_assignment.findUnique({
      where: { assignment_id }
    });
    
    if (currentAssignment) {
      const teacherConflict = overlappingLessons.find(l => 
        l.teacher_assignment && l.teacher_assignment.teacher_id === currentAssignment.teacher_id
      );
      if (teacherConflict) {
        errors.push("Преподаватель занят в это время");
      }
    }
  }

  // 3. Помещение занято
  const roomConflict = overlappingLessons.find(l => l.room_id === room_id);
  if (roomConflict) {
    errors.push(`Аудитория уже занята в это время`);
  }

  // 4. Вместимость помещения и 5. Тип помещения
  const room = await prisma.room.findUnique({ where: { room_id } });
  const group = await prisma.study_group.findUnique({ where: { study_group_id } });
  
  if (room && group) {
    if (!room.is_online && group.student_count > room.capacity) {
      errors.push(`Вместимость аудитории (${room.capacity}) меньше количества студентов в группе (${group.student_count})`);
    }

    if (lesson_type === "LAB" && !["LABORATORY", "COMPUTER"].includes(room.room_type)) {
      errors.push("Лабораторные работы должны проходить в лаборатории или компьютерном классе");
    }
  }

  // 6. Ограничение 5 пар в день для группы
  const groupDayLessons = await prisma.lesson.findMany({
    where: { schedule_id, study_group_id, day_of_week, is_recurring: true }
  });
  const groupOverlaps = groupDayLessons.filter(l => weekParityOverlaps(l.week_parity, week_parity));
  if (groupOverlaps.length >= 5) {
    errors.push("У группы превышен лимит: не более 5 пар в день");
  }

  // 7. Ограничение 5 пар в день для преподавателя
  if (assignment_id) {
    const currentAssignment = await prisma.teacher_assignment.findUnique({
      where: { assignment_id }
    });
    if (currentAssignment) {
      const teacherAssignments = await prisma.teacher_assignment.findMany({
        where: { teacher_id: currentAssignment.teacher_id }
      });
      const assignmentIds = teacherAssignments.map(a => a.assignment_id);
      
      const teacherDayLessons = await prisma.lesson.findMany({
        where: { schedule_id, assignment_id: { in: assignmentIds }, day_of_week, is_recurring: true }
      });
      const teacherOverlaps = teacherDayLessons.filter(l => weekParityOverlaps(l.week_parity, week_parity));
      
      if (teacherOverlaps.length >= 5) {
        errors.push("У преподавателя превышен лимит: не более 5 пар в день");
      }
    }
  }

  // 8. Время на перемещение между корпусами
  if (slot_id > 1 && room && !room.is_online) {
    const prevLessons = await prisma.lesson.findMany({
      where: { 
        schedule_id, 
        study_group_id, 
        day_of_week, 
        slot_id: slot_id - 1, 
        is_recurring: true 
      },
      include: { room: true }
    });
    
    const prevOverlaps = prevLessons.filter(l => weekParityOverlaps(l.week_parity, week_parity));
    
    for (const prevLesson of prevOverlaps) {
      if (prevLesson.room && !prevLesson.room.is_online && prevLesson.room.building_id !== room.building_id) {
        const distance = await prisma.building_distance.findUnique({
          where: {
            from_building_id_to_building_id: {
              from_building_id: prevLesson.room.building_id,
              to_building_id: room.building_id
            }
          }
        });
        
        const breakMinutes = SLOT_BREAKS[slot_id] || 10;
        if (distance && distance.travel_minutes > breakMinutes) {
          errors.push(`Не хватит времени на переход между корпусами (нужно ${distance.travel_minutes} мин, а перемена ${breakMinutes} мин)`);
        }
      }
    }
  }

  return errors;
}

module.exports = { checkConflicts };
