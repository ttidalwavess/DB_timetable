//Валидация формы занятия до сабмита

//пересекаются ли две "чётности" недели  
export function weekParityOverlaps(a, b) {
  if (!a || !b || a === "BOTH" || b === "BOTH") return true;
  return a === b;
}

//аудитории для лаб
export function validateRoomTypeForLab(lesson, { rooms }) {
  if (lesson.lesson_type !== "LAB") return null;
  const room = rooms.find(r => r.room_id === lesson.room_id);
  if (!room) return null;

  if (!["LABORATORY", "COMPUTER"].includes(room.room_type)) {
    return {
      ok: false,
      level: "error",
      field: "room_id",
      message: `Лабораторная работа требует тип «Лаборатория» или «Компьютерный класс», а выбрано: ${room.room_type}`,
    };
  }
  return { ok: true, level: "ok", field: "room_id", message: "Тип помещения подходит для лабораторной" };
}

//Вместимость
export function validateCapacity(lesson, { rooms, studyGroups }) {
  const room  = rooms.find(r => r.room_id === lesson.room_id);
  const group = studyGroups.find(g => g.study_group_id === lesson.study_group_id);
  if (!room || !group) return null;

  //вместимость не ограничена
  if (room.is_online) {
    return {
      ok: true,
      level: "ok",
      field: "room_id",
      message: `Онлайн-аудитория — вместимость не ограничена. В группе: ${group.student_count} чел.`,
    };
  }

  const diff = room.capacity - group.student_count;

  if (diff < 0) {
    return {
      ok: false,
      level: "error",
      field: "room_id",
      message: `Вместимость: ${room.capacity} мест, в группе: ${group.student_count} студентов ⚠️ — не хватает ${-diff} мест`,
    };
  }

  if (diff <= 2) {
    return {
      ok: true,
      level: "warning",
      field: "room_id",
      message: `Вместимость: ${room.capacity} мест, в группе: ${group.student_count} студентов (запас ${diff} места)`,
    };
  }

  return {
    ok: true,
    level: "ok",
    field: "room_id",
    message: `Вместимость: ${room.capacity} мест, в группе: ${group.student_count} студентов`,
  };
}

//5 пар в день (для группы и преподавателя) 
const DAY_LIMIT = 5;

function countDayLessons(lessons, { matchField, matchValue, day_of_week, week_parity, excludeLessonId }) {
  return lessons.filter(l => {
    if (excludeLessonId != null && l.lesson_id === excludeLessonId) return false;
    if (l[matchField] !== matchValue) return false;
    if (l.day_of_week !== day_of_week) return false;
    if (!l.is_recurring) return false; // разовые (экзамен/зачёт) не считаем в лимит 
    return weekParityOverlaps(l.week_parity, week_parity);
  }).length;
}

export function validateGroupDailyLimit(lesson, { lessons }) {
  if (!lesson.is_recurring || !lesson.day_of_week || !lesson.study_group_id) return null;

  const existing = countDayLessons(lessons, {
    matchField: "study_group_id",
    matchValue: lesson.study_group_id,
    day_of_week: lesson.day_of_week,
    week_parity: lesson.week_parity || "BOTH",
    excludeLessonId: lesson.lesson_id,
  });

  const total = existing + 1; // + добавляемое/редактируемое занятие

  if (total > DAY_LIMIT) {
    return {
      ok: false,
      level: "error",
      field: "day_of_week",
      message: `У группы уже ${existing} пар в этот день — добавление превысит лимит ${DAY_LIMIT} пар/день (итого ${total})`,
    };
  }

  if (total === DAY_LIMIT) {
    return {
      ok: true,
      level: "warning",
      field: "day_of_week",
      message: `Это будет ${total}-я пара группы в этот день`,
    };
  }

  return {
    ok: true,
    level: "ok",
    field: "day_of_week",
    message: `У группы ${existing} из ${DAY_LIMIT} пар в этот день`,
  };
}

export function validateTeacherDailyLimit(lesson, { lessons, teacherAssignments }) {
  if (!lesson.is_recurring || !lesson.day_of_week || !lesson.assignment_id) return null;

  const assignment = teacherAssignments.find(a => a.assignment_id === lesson.assignment_id);
  if (!assignment) return null;

  // считаем по всем поручениям этого преподавателя, не только по текущему
  const teacherAssignmentIds = teacherAssignments
    .filter(a => a.teacher_id === assignment.teacher_id)
    .map(a => a.assignment_id);

  const existing = lessons.filter(l => {
    if (lesson.lesson_id != null && l.lesson_id === lesson.lesson_id) return false;
    if (!teacherAssignmentIds.includes(l.assignment_id)) return false;
    if (l.day_of_week !== lesson.day_of_week) return false;
    if (!l.is_recurring) return false;
    return weekParityOverlaps(l.week_parity, lesson.week_parity || "BOTH");
  }).length;

  const total = existing + 1;

  if (total > DAY_LIMIT) {
    return {
      ok: false,
      level: "error",
      field: "assignment_id",
      message: `У преподавателя уже ${existing} пар в этот день — превышение лимита ${DAY_LIMIT} пар/день (итого ${total})`,
    };
  }

  if (total === DAY_LIMIT) {
    return {
      ok: true,
      level: "warning",
      field: "assignment_id",
      message: `Это будет ${total}-я пара преподавателя в этот день`,
    };
  }

  return null; 
}

//Время перехода между корпусами
export const SLOT_BREAKS = { 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10 };

export function validateTravelTime(lesson, { lessons, rooms, buildingDistances }) {
  if (!lesson.is_recurring || !lesson.day_of_week || !lesson.slot_id || lesson.slot_id <= 1) return null;

  const room = rooms.find(r => r.room_id === lesson.room_id);
  if (!room || room.is_online) return null;

  //занятие этой же группы на предыдущей паре
  const prevLesson = lessons.find(l =>
    l.lesson_id !== lesson.lesson_id &&
    l.study_group_id === lesson.study_group_id &&
    l.day_of_week === lesson.day_of_week &&
    l.slot_id === lesson.slot_id - 1 &&
    weekParityOverlaps(l.week_parity, lesson.week_parity || "BOTH")
  );
  if (!prevLesson) return null;

  const prevRoom = rooms.find(r => r.room_id === prevLesson.room_id);
  if (!prevRoom || prevRoom.is_online || prevRoom.building_id === room.building_id) return null;

  const dist = buildingDistances.find(d =>
    d.from_building_id === prevRoom.building_id && d.to_building_id === room.building_id
  );
  const breakMin = SLOT_BREAKS[lesson.slot_id] ?? 10;

  if (!dist) {
    return {
      ok: true,
      level: "warning",
      field: "room_id",
      message: `Предыдущая пара группы — в другом корпусе (#${prevRoom.building_id}). Время перехода неизвестно.`,
    };
  }

  if (dist.travel_minutes > breakMin) {
    return {
      ok: false,
      level: "error",
      field: "room_id",
      message: `Переход из корпуса ${prevRoom.building_id} в корпус ${room.building_id}: нужно ${dist.travel_minutes} мин, перерыв между парами — ${breakMin} мин`,
    };
  }

  return {
    ok: true,
    level: "ok",
    field: "room_id",
    message: `Переход из корпуса ${prevRoom.building_id}: ${dist.travel_minutes} мин (перерыв ${breakMin} мин) — успевают`,
  };
}

//запуск всех локальных правил

export function runLocalValidation(lesson, context) {
  const results = [
    validateRoomTypeForLab(lesson, context),
    validateCapacity(lesson, context),
    validateGroupDailyLimit(lesson, context),
    validateTeacherDailyLimit(lesson, context),
    validateTravelTime(lesson, context),
  ].filter(Boolean);

  const byField = {};
  for (const r of results) {
    const prev = byField[r.field];
    if (!prev || severityRank(r.level) > severityRank(prev.level)) {
      byField[r.field] = r;
    }
  }

  const errors   = results.filter(r => r.level === "error");
  const warnings = results.filter(r => r.level === "warning");

  return {
    results,
    byField,
    errors,
    warnings,
    hasErrors: errors.length > 0,
  };
}

function severityRank(level) {
  return { ok: 0, warning: 1, error: 2 }[level] ?? 0;
}
