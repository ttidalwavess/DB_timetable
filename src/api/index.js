/**
 * api/index.js — единственный файл для замены когда придёт бэкенд.
 * Когда API будет готово — заменить тела функций на fetch('/api/...').
 */
import {
  SLOTS, DAYS_OF_WEEK, STUDY_GROUPS, TEACHERS, ROOMS, BUILDINGS,
  ROOM_TYPE_LABELS, TEACHER_ASSIGNMENTS, LESSONS, SESSION_LESSONS,
  BUILDING_DISTANCES, CURRICULUM_SUBJECTS, SUBJECTS,
  filterLessons, filterSessionLessons, enrichLesson, teacherShortName,
} from "../data/mockData";

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

export const api = {
  getSlots:       async () => { await delay(); return SLOTS; },
  getDays:        async () => { await delay(); return DAYS_OF_WEEK; },
  getStudyGroups: async () => { await delay(); return STUDY_GROUPS; },
  getTeachers:    async () => { await delay(); return TEACHERS; },
  getRooms:       async () => { await delay(); return ROOMS; },
  getBuildings:   async () => { await delay(); return BUILDINGS; },
  getSubjects:    async () => { await delay(); return SUBJECTS; },

  getLessons: async (filters = {}) => {
    await delay(200);
    return filterLessons(filters);
  },

  getSessionLessons: async (filters = {}) => {
    await delay(200);
    return filterSessionLessons(filters);
  },

  // Загрузка аудиторий: grid[dayOfWeek_slotId] → enrichedLesson[]
  getRoomLoad: async () => {
    await delay(250);
    const result = {};
    ROOMS.forEach(room => {
      result[room.room_id] = {
        room,
        building: BUILDINGS.find(b => b.building_id === room.building_id),
        typeLabel: ROOM_TYPE_LABELS[room.room_type] || room.room_type,
        grid: {},
      };
    });
    LESSONS.forEach(l => {
      const key = `${l.day_of_week}_${l.slot_id}`;
      if (!result[l.room_id]) return;
      if (!result[l.room_id].grid[key]) result[l.room_id].grid[key] = [];
      result[l.room_id].grid[key].push(enrichLesson(l));
    });
    return result;
  },

  // Занятость одного преподавателя — для страницы /teachers
  getTeacherLessons: async (teacherId) => {
    await delay(200);
    return LESSONS
      .filter(l => {
        const a = TEACHER_ASSIGNMENTS.find(x => x.assignment_id === l.assignment_id);
        return a && a.teacher_id === teacherId;
      })
      .map(enrichLesson);
  },

  // Сводная нагрузка всех преподавателей (как v_teacher_load в БД)
  getTeacherLoadSummary: async () => {
    await delay(250);
    return TEACHERS.map(teacher => {
      const assignments = TEACHER_ASSIGNMENTS.filter(a => a.teacher_id === teacher.teacher_id);
      const lessons = LESSONS.filter(l =>
        assignments.some(a => a.assignment_id === l.assignment_id)
      ).map(enrichLesson);

      // считаем пары по дням для проверки лимита 5 пар/день
      const byDay = {};
      DAYS_OF_WEEK.forEach(d => { byDay[d.id] = lessons.filter(l => l.day_of_week === d.id).length; });
      const maxPerDay = Math.max(0, ...Object.values(byDay));

      // считаем по предметам
      const bySubject = {};
      lessons.forEach(l => {
        const key = l.subjectName;
        if (!bySubject[key]) bySubject[key] = { name: key, LEC: 0, PRAC: 0, LAB: 0, total: 0 };
        bySubject[key][l.lesson_type] = (bySubject[key][l.lesson_type] || 0) + 1;
        bySubject[key].total++;
      });

      return {
        teacher,
        shortName: teacherShortName(teacher),
        lessons,
        total: lessons.length,
        maxPerDay,
        overLimit: maxPerDay > 5,
        byDay,
        bySubject: Object.values(bySubject),
      };
    });
  },

  // Проверка конфликтов для одного занятия (подсветка на фронте)
  checkConflicts: async (lesson) => {
    await delay(50);
    const conflicts = [];
    const room = ROOMS.find(r => r.room_id === lesson.room_id);
    const group = STUDY_GROUPS.find(g => g.study_group_id === lesson.study_group_id);

    // 1. Тип помещения для LAB
    if (lesson.lesson_type === "LAB" && room && !["LABORATORY","COMPUTER"].includes(room.room_type)) {
      conflicts.push({ code: "WRONG_ROOM_TYPE", text: `Лаб. работа в ${ROOM_TYPE_LABELS[room.room_type] || room.room_type} — нужна лаборатория или комп. класс` });
    }

    // 2. Вместимость
    if (room && group && !room.is_online && group.student_count > room.capacity) {
      conflicts.push({ code: "CAPACITY_EXCEEDED", text: `Студентов ${group.student_count}, мест ${room.capacity}` });
    }

    // 3. Время перехода между корпусами (предыдущая пара группы)
    if (lesson.slot_id > 1 && lesson.day_of_week) {
      const prevLesson = LESSONS.find(l =>
        l.study_group_id === lesson.study_group_id &&
        l.day_of_week === lesson.day_of_week &&
        l.slot_id === lesson.slot_id - 1 &&
        l.lesson_id !== lesson.lesson_id
      );
      if (prevLesson) {
        const prevRoom = ROOMS.find(r => r.room_id === prevLesson.room_id);
        if (prevRoom && room && prevRoom.building_id !== room.building_id) {
          const dist = BUILDING_DISTANCES.find(d =>
            d.from_building_id === prevRoom.building_id && d.to_building_id === room.building_id
          );
          const slotBreaks = { 2:10, 3:10, 4:10, 5:10 }; // минут перерыва между парами
          const breakMin = slotBreaks[lesson.slot_id] || 10;
          if (dist && dist.travel_minutes > breakMin) {
            conflicts.push({
              code: "TRAVEL_TIME",
              text: `Переход из корп. ${prevRoom.building_id} → ${room.building_id}: нужно ${dist.travel_minutes} мин, перерыв ${breakMin} мин`,
            });
          }
        }
      }
    }

    return conflicts;
  },
};
