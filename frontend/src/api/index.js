/**
 * api/index.js — единственный файл для замены когда придёт бэкенд.
 * Когда API будет готово — заменить тела функций на fetch('/api/...').
 *
 * ДОБАВЛЕНО к исходной версии:
 *  - checkConflicts(): пересечения по времени (группа / преподаватель /
 *    аудитория уже заняты) + лимит 5 пар/день (для группы и преподавателя).
 *    Раньше проверялись только тип аудитории, вместимость и переход
 *    между корпусами — теперь покрыты все 4 пункта из требований.
 *  - createLesson / updateLesson / deleteLesson — мутации мок-массива LESSONS.
 *  - copyScheduleLessons — копирование занятий в новое расписание.
 */
import {
  SLOTS, DAYS_OF_WEEK, STUDY_GROUPS, TEACHERS, ROOMS, BUILDINGS,
  ROOM_TYPE_LABELS, TEACHER_ASSIGNMENTS, LESSONS, SESSION_LESSONS,
  BUILDING_DISTANCES, CURRICULUM_SUBJECTS, SUBJECTS, SCHEDULES,
  filterLessons, filterSessionLessons, enrichLesson, teacherShortName, LESSON_TYPES
} from "../data/mockData";

import {
  weekParityOverlaps,
  SLOT_BREAKS,
} from "../utils/lessonValidation";

const delay = (ms = 150) => new Promise(r => setTimeout(r, ms));

const DAY_LIMIT = 5;

// Автоинкремент id для новых занятий в мок-данных
let nextLessonId = Math.max(0, ...LESSONS.map(l => l.lesson_id)) + 1;

let cachedScheduleId = null;
const getActiveScheduleId = async () => {
  if (cachedScheduleId) return cachedScheduleId;
  try {
    const res = await fetch('/api/schedule');
    if (res.ok) {
      const data = await res.json();
      if (data.length > 0) {
        cachedScheduleId = data[0].schedule_id;
        return cachedScheduleId;
      }
    }
  } catch(e) {}
  return 1;
};

export const api = {
  getSlots:       async () => { await delay(); return SLOTS; },
  getDays:        async () => { await delay(); return DAYS_OF_WEEK; },
  getSchools: async () => {
    try {
      const res = await fetch('/api/refs/schools');
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  },
  getDepartments: async () => {
    try {
      const res = await fetch('/api/refs/departments');
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  },
  getAcademicGroups: async () => {
    try {
      const res = await fetch('/api/refs/academic-groups');
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  },
  getStudyGroups: async () => { 
    try {
      const res = await fetch('/api/refs/groups');
      if (res.ok) return await res.json();
    } catch(e) {}
    return STUDY_GROUPS; 
  },
  getTeachers: async () => { 
    try {
      const res = await fetch('/api/refs/teachers');
      if (res.ok) return await res.json();
    } catch(e) {}
    return TEACHERS; 
  },
  getRooms: async () => { 
    try {
      const res = await fetch('/api/refs/rooms');
      if (res.ok) return await res.json();
    } catch(e) {}
    return ROOMS; 
  },
  getBuildings:   async () => { 
    try {
      const res = await fetch('/api/refs/buildings');
      if (res.ok) return await res.json();
    } catch(e) {}
    return BUILDINGS; 
  },
  getSubjects: async () => {
    try {
      const res = await fetch('/api/refs/subjects');
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  },
  getTeacherAssignments: async () => {
    try {
      const res = await fetch('/api/refs/assignments');
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  },
  getBuildingDistances:  async () => { await delay(); return BUILDING_DISTANCES; },
  getCurriculumSubjects: async () => {
    try {
      const res = await fetch('/api/refs/curriculum-subjects');
      if (res.ok) return await res.json();
    } catch(e) {}
    return [];
  },
  getSchedules:   async () => { 
    try {
      const res = await fetch('/api/schedule');
      if (!res.ok) throw new Error('Network error');
      return await res.json();
    } catch(e) {
      console.warn("Backend unavailable, falling back to mock schedules");
      return SCHEDULES;
    }
  },
  

  getLessons: async (filters = {}) => {
    try {
      const sId = await getActiveScheduleId();
      const res = await fetch(`/api/schedule/${sId}/lessons`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      return data.map(l => {
        const typeInfo = LESSON_TYPES[l.lesson_type] || { label: l.lesson_type, color: "#888", bg: "#88888815" };
        return {
          ...l,
          teacher: l.teacher_assignment?.teacher,
          teacherShort: l.teacher_assignment?.teacher ? teacherShortName(l.teacher_assignment.teacher) : "—",
          subject: l.curriculum_subject?.subject,
          subjectName: l.curriculum_subject?.subject?.subject_name || "—",
          studyGroup: l.study_group,
          groupName: l.study_group?.study_group_name || "—",
          room: l.room,
          roomLabel: l.room ? `${l.room.building?.building_name} — ${l.room.room_number}` : "—",
          building: l.room?.building,
          slot: SLOTS.find(s => s.slot_id === l.slot_id),
          day: l.day_of_week ? DAYS_OF_WEEK.find(d => d.id === l.day_of_week) : null,
          typeInfo
        };
      }).filter(l => {
        if (filters.studyGroupId && l.study_group_id !== filters.studyGroupId) return false;
        if (filters.teacherId && l.teacher_assignment?.teacher_id !== filters.teacherId) return false;
        if (filters.roomId && l.room_id !== filters.roomId) return false;
        if (filters.dayOfWeek && l.day_of_week !== filters.dayOfWeek) return false;
        if (filters.weekParity && l.week_parity !== "BOTH" && l.week_parity !== filters.weekParity) return false;
        return true;
      });
    } catch(e) {
      console.warn("Backend unavailable, falling back to mock lessons");
      return filterLessons(filters);
    }
  },

  getSessionLessons: async (filters = {}) => {
    try {
      const sId = await getActiveScheduleId();
      const res = await fetch(`/api/reports/exams/${sId}`);
      if (!res.ok) throw new Error('Network error');
      const data = await res.json();
      
      return data.map(l => {
        const typeInfo = LESSON_TYPES[l.lesson_type] || { label: l.lesson_type, color: "#888", bg: "#88888815" };
        return {
          ...l,
          typeInfo
        };
      }).filter(l => {
        if (filters.studyGroupId && l.study_group_id !== filters.studyGroupId) return false;
        if (filters.teacherId && l.teacher_assignment?.teacher_id !== filters.teacherId) return false;
        return true;
      });
    } catch(e) {
      console.warn("Backend unavailable, falling back to mock session lessons");
      return filterSessionLessons(filters);
    }
  },

  // Загрузка аудиторий: grid[dayOfWeek_slotId] → enrichedLesson[]
  getRoomLoad: async () => {
    try {
      const sId = await getActiveScheduleId();
      const res = await fetch(`/api/reports/room-load/${sId}`);
      if (res.ok) {
        const data = await res.json();
        // Обогащаем typeInfo
        Object.values(data).forEach(roomData => {
          Object.values(roomData.grid).forEach(slotLessons => {
            slotLessons.forEach(l => {
              l.typeInfo = LESSON_TYPES[l.lesson_type] || { label: l.lesson_type, color: "#888", bg: "#88888815" };
            });
          });
        });
        return data;
      }
    } catch(e) {
      console.warn("Backend unavailable for roomLoad", e);
    }

    // Fallback
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
    try {
      const sId = await getActiveScheduleId();
      const res = await fetch(`/api/reports/teacher-load/${sId}`);
      if (res.ok) return await res.json();
    } catch(e) {
      console.warn("Backend unavailable for teacherLoadSummary", e);
    }

    // Fallback
    await delay(250);
    return TEACHERS.map(teacher => {
      const assignments = TEACHER_ASSIGNMENTS.filter(a => a.teacher_id === teacher.teacher_id);
      const lessons = LESSONS.filter(l =>
        assignments.some(a => a.assignment_id === l.assignment_id)
      ).map(enrichLesson);

      const byDay = {};
      DAYS_OF_WEEK.forEach(d => { byDay[d.id] = lessons.filter(l => l.day_of_week === d.id).length; });
      const maxPerDay = Math.max(0, ...Object.values(byDay));

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
        total: lessons.length,
        maxPerDay,
        overLimit: maxPerDay > DAY_LIMIT,
        byDay,
        bySubject: Object.values(bySubject),
      };
    });
  },

  checkConflicts: async (lesson) => {
    await delay(50);
    const conflicts = [];
    const room  = ROOMS.find(r => r.room_id === lesson.room_id);
    const group = STUDY_GROUPS.find(g => g.study_group_id === lesson.study_group_id);
    const assignment = TEACHER_ASSIGNMENTS.find(a => a.assignment_id === lesson.assignment_id);

    if (lesson.lesson_type === "LAB" && room && !["LABORATORY","COMPUTER"].includes(room.room_type)) {
      conflicts.push({
        code: "WRONG_ROOM_TYPE",
        text: `Лаб. работа в ${ROOM_TYPE_LABELS[room.room_type] || room.room_type} — нужна лаборатория или комп. класс`,
      });
    }

    if (room && group && !room.is_online && group.student_count > room.capacity) {
      conflicts.push({
        code: "CAPACITY_EXCEEDED",
        text: `Студентов ${group.student_count}, мест ${room.capacity}`,
      });
    }

    // Пересечения по времени (группа / преподаватель / аудитория) ─
    // Для еженедельных занятий сравниваем по (day_of_week, slot_id, week_parity).
    // Для разовых (экзамен/зачёт/консультация) — по (specific_date, slot_id).
    const others = LESSONS.filter(l => l.lesson_id !== lesson.lesson_id);

    const overlapsInTime = (l) => {
      if (lesson.is_recurring) {
        if (!l.is_recurring) return false;
        return l.day_of_week === lesson.day_of_week
          && l.slot_id === lesson.slot_id
          && weekParityOverlaps(l.week_parity, lesson.week_parity || "BOTH");
      } else {
        if (l.is_recurring) return false;
        return l.specific_date === lesson.specific_date
          && l.slot_id === lesson.slot_id;
      }
    };

    const groupConflict = others.find(l =>
      l.study_group_id === lesson.study_group_id && overlapsInTime(l)
    );
    if (groupConflict) {
      conflicts.push({
        code: "GROUP_CONFLICT",
        text: `Группа уже занята в это время (${groupConflict.subjectName || "другое занятие"})`,
      });
    }

    if (assignment) {
      const teacherConflict = others.find(l => {
        const a = TEACHER_ASSIGNMENTS.find(x => x.assignment_id === l.assignment_id);
        return a && a.teacher_id === assignment.teacher_id && overlapsInTime(l);
      });
      if (teacherConflict) {
        conflicts.push({
          code: "TEACHER_CONFLICT",
          text: `Преподаватель уже ведёт занятие в это время (${teacherConflict.subjectName || "другая группа"})`,
        });
      }
    }

    if (room && !room.is_online) {
      const roomConflict = others.find(l =>
        l.room_id === lesson.room_id && overlapsInTime(l)
      );
      if (roomConflict) {
        conflicts.push({
          code: "ROOM_CONFLICT",
          text: `Аудитория ${room.room_number} уже занята в это время`,
        });
      }
    }

    if (lesson.is_recurring && lesson.day_of_week) {
      const groupDayCount = others.filter(l =>
        l.is_recurring &&
        l.study_group_id === lesson.study_group_id &&
        l.day_of_week === lesson.day_of_week &&
        weekParityOverlaps(l.week_parity, lesson.week_parity || "BOTH")
      ).length;

      if (groupDayCount + 1 > DAY_LIMIT) {
        conflicts.push({
          code: "GROUP_DAY_LIMIT",
          text: `У группы превышен лимит ${DAY_LIMIT} пар в день (уже ${groupDayCount})`,
        });
      }

      if (assignment) {
        const teacherAssignmentIds = TEACHER_ASSIGNMENTS
          .filter(a => a.teacher_id === assignment.teacher_id)
          .map(a => a.assignment_id);

        const teacherDayCount = others.filter(l =>
          l.is_recurring &&
          teacherAssignmentIds.includes(l.assignment_id) &&
          l.day_of_week === lesson.day_of_week &&
          weekParityOverlaps(l.week_parity, lesson.week_parity || "BOTH")
        ).length;

        if (teacherDayCount + 1 > DAY_LIMIT) {
          conflicts.push({
            code: "TEACHER_DAY_LIMIT",
            text: `У преподавателя превышен лимит ${DAY_LIMIT} пар в день (уже ${teacherDayCount})`,
          });
        }
      }
    }

    if (lesson.is_recurring && lesson.slot_id > 1 && lesson.day_of_week) {
      const prevLesson = LESSONS.find(l =>
        l.lesson_id !== lesson.lesson_id &&
        l.study_group_id === lesson.study_group_id &&
        l.day_of_week === lesson.day_of_week &&
        l.slot_id === lesson.slot_id - 1 &&
        weekParityOverlaps(l.week_parity, lesson.week_parity || "BOTH")
      );
      if (prevLesson && room && !room.is_online) {
        const prevRoom = ROOMS.find(r => r.room_id === prevLesson.room_id);
        if (prevRoom && !prevRoom.is_online && prevRoom.building_id !== room.building_id) {
          const dist = BUILDING_DISTANCES.find(d =>
            d.from_building_id === prevRoom.building_id && d.to_building_id === room.building_id
          );
          const breakMin = SLOT_BREAKS[lesson.slot_id] ?? 10;
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

  createLesson: async (lesson) => {
    try {
      const sId = await getActiveScheduleId();
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/schedule/${sId}/lessons`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(lesson)
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error("Пожалуйста, авторизуйтесь для редактирования");
      }
      if (res.status === 422) {
        const errorData = await res.json();
        const err = new Error("CONFLICTS");
        err.conflicts = errorData.conflicts;
        throw err;
      }
      if (!res.ok) {
        throw new Error("Ошибка при добавлении занятия");
      }
      const data = await res.json();
      const l = data.lesson;
      
      const typeInfo = LESSON_TYPES[l.lesson_type] || { label: l.lesson_type, color: "#888", bg: "#88888815" };
      return {
          ...l,
          teacher: l.teacher_assignment?.teacher,
          teacherShort: l.teacher_assignment?.teacher ? teacherShortName(l.teacher_assignment.teacher) : "—",
          subject: l.curriculum_subject?.subject,
          subjectName: l.curriculum_subject?.subject?.subject_name || "—",
          studyGroup: l.study_group,
          groupName: l.study_group?.study_group_name || "—",
          room: l.room,
          roomLabel: l.room ? `${l.room.building?.building_name} — ${l.room.room_number}` : "—",
          building: l.room?.building,
          slot: SLOTS.find(s => s.slot_id === l.slot_id),
          day: l.day_of_week ? DAYS_OF_WEEK.find(d => d.id === l.day_of_week) : null,
          typeInfo
      };
    } catch(e) {
      if (e.message === "CONFLICTS") throw e;
      if (e.message === "Пожалуйста, авторизуйтесь для редактирования") throw e;
      console.warn("Backend unavailable or error", e);
      // Fallback for mock if backend fails completely
      const conflicts = await api.checkConflicts({ ...lesson, lesson_id: null });
      const blocking = conflicts.filter(c =>
        ["GROUP_CONFLICT","TEACHER_CONFLICT","ROOM_CONFLICT","CAPACITY_EXCEEDED",
         "WRONG_ROOM_TYPE","GROUP_DAY_LIMIT","TEACHER_DAY_LIMIT","TRAVEL_TIME"].includes(c.code)
      );
      if (blocking.length) {
        const err = new Error("CONFLICTS");
        err.conflicts = blocking;
        throw err;
      }

      const newLesson = { ...lesson, lesson_id: nextLessonId++ };
      LESSONS.push(newLesson);
      return enrichLesson(newLesson);
    }
  },

  updateLesson: async (lessonId, patch) => {
    try {
      const sId = await getActiveScheduleId();
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/schedule/${sId}/lessons/${lessonId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(patch)
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error("Пожалуйста, авторизуйтесь для редактирования");
      }
      if (res.status === 422) {
        const errorData = await res.json();
        const err = new Error("CONFLICTS");
        // Конвертируем формат массива строк в формат массива объектов { text: ... } для UI
        err.conflicts = errorData.conflicts.map(c => ({ text: c }));
        throw err;
      }
      if (!res.ok) throw new Error("Ошибка при обновлении занятия");
      
      const data = await res.json();
      const l = data.lesson;
      const typeInfo = LESSON_TYPES[l.lesson_type] || { label: l.lesson_type, color: "#888", bg: "#88888815" };
      
      return {
          ...l,
          teacher: l.teacher_assignment?.teacher,
          teacherShort: l.teacher_assignment?.teacher ? teacherShortName(l.teacher_assignment.teacher) : "—",
          subject: l.curriculum_subject?.subject,
          subjectName: l.curriculum_subject?.subject?.subject_name || "—",
          studyGroup: l.study_group,
          groupName: l.study_group?.study_group_name || "—",
          room: l.room,
          roomLabel: l.room ? `${l.room.building?.building_name} — ${l.room.room_number}` : "—",
          building: l.room?.building,
          slot: SLOTS.find(s => s.slot_id === l.slot_id),
          day: l.day_of_week ? DAYS_OF_WEEK.find(d => d.id === l.day_of_week) : null,
          typeInfo
      };
    } catch(e) {
      if (e.message === "CONFLICTS") throw e;
      if (e.message === "Пожалуйста, авторизуйтесь для редактирования") throw e;
      console.warn("Backend unavailable or error", e);
      // Фолбэк на мок-логику если бэкенд не ответил
      await delay(150);
      const idx = LESSONS.findIndex(l => l.lesson_id === lessonId);
      if (idx === -1) throw new Error("Занятие не найдено");

      const candidate = { ...LESSONS[idx], ...patch, lesson_id: lessonId };
      const conflicts = await api.checkConflicts(candidate);
      const blocking = conflicts.filter(c =>
        ["GROUP_CONFLICT","TEACHER_CONFLICT","ROOM_CONFLICT","CAPACITY_EXCEEDED",
         "WRONG_ROOM_TYPE","GROUP_DAY_LIMIT","TEACHER_DAY_LIMIT","TRAVEL_TIME"].includes(c.code)
      );
      if (blocking.length) {
        const err = new Error("CONFLICTS");
        err.conflicts = blocking;
        throw err;
      }

      LESSONS[idx] = candidate;
      return enrichLesson(candidate);
    }
  },

  deleteLesson: async (lessonId) => {
    try {
      const sId = await getActiveScheduleId();
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/schedule/${sId}/lessons/${lessonId}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error("Пожалуйста, авторизуйтесь для редактирования");
      }
      if (res.ok) return { ok: true };
    } catch (e) {
      if (e.message === "Пожалуйста, авторизуйтесь для редактирования") throw e;
      console.warn("Backend unavailable for delete", e);
    }
    // Фолбэк
    await delay(150);
    const idx = LESSONS.findIndex(l => l.lesson_id === lessonId);
    if (idx === -1) return { ok: false };
    LESSONS.splice(idx, 1);
    return { ok: true };
  },


  copySchedule: async ({ sourceScheduleId, name, academicYear, semesterNumber }) => {
    await delay(300);

    if (!name || !name.trim()) {
      const err = new Error("VALIDATION");
      err.fieldErrors = { name: "Введите название нового расписания" };
      throw err;
    }

    const nameTaken = SCHEDULES.some(s => s.schedule_name.trim().toLowerCase() === name.trim().toLowerCase());
    if (nameTaken) {
      const err = new Error("VALIDATION");
      err.fieldErrors = { name: "Расписание с таким названием уже существует" };
      throw err;
    }

    const source = SCHEDULES.find(s => s.schedule_id === sourceScheduleId);
    if (!source) throw new Error("Исходное расписание не найдено");

    const newScheduleId = Math.max(0, ...SCHEDULES.map(s => s.schedule_id)) + 1;
    const newSchedule = {
      ...source,
      schedule_id: newScheduleId,
      schedule_name: name.trim(),
      academic_year: academicYear ?? source.academic_year,
      semester_number: semesterNumber ?? source.semester_number,
      is_active: false,
      copied_from_id: source.schedule_id,
    };
    SCHEDULES.push(newSchedule);

    const sourceLessons = LESSONS.filter(l => l.schedule_id === sourceScheduleId);
    const copies = sourceLessons.map(l => ({
      ...l,
      lesson_id: nextLessonId++,
      schedule_id: newScheduleId,
    }));
    LESSONS.push(...copies);

    return { schedule: newSchedule, copiedLessonsCount: copies.length };
  },
};
