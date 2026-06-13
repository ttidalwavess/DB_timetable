/**
 * mockData.js
 * Все данные соответствуют реальной схеме БД (db_schedule.sql).
 * Когда API будет готово — заменить только src/api/*.js, остальное не трогать.
 */

// ── slot (расписание звонков) ─────────────────────────────────
export const SLOTS = [
  { slot_id: 1, slot_number: 1, time_start: "08:30", time_end: "10:00" },
  { slot_id: 2, slot_number: 2, time_start: "10:10", time_end: "11:40" },
  { slot_id: 3, slot_number: 3, time_start: "11:50", time_end: "13:20" },
  { slot_id: 4, slot_number: 4, time_start: "13:30", time_end: "15:00" },
  { slot_id: 5, slot_number: 5, time_start: "15:10", time_end: "16:40" },
  { slot_id: 6, slot_number: 6, time_start: "16:50", time_end: "18:20" },
];

export const DAYS_OF_WEEK = [
  { id: 1, name: "Понедельник", short: "Пн" },
  { id: 2, name: "Вторник",     short: "Вт" },
  { id: 3, name: "Среда",       short: "Ср" },
  { id: 4, name: "Четверг",     short: "Чт" },
  { id: 5, name: "Пятница",     short: "Пт" },
  { id: 6, name: "Суббота",     short: "Сб" },
];

// ── school ────────────────────────────────────────────────────
export const SCHOOLS = [
  { school_id: 1, school_name: "Школа цифровой экономики" },
  { school_id: 2, school_name: "Институт математики и компьютерных технологий" },
];

// ── department ────────────────────────────────────────────────
export const DEPARTMENTS = [
  { department_id: 1, department_name: "Кафедра информационных систем", school_id: 1 },
  { department_id: 2, department_name: "Кафедра программной инженерии",  school_id: 1 },
  { department_id: 3, department_name: "Кафедра математики",             school_id: 2 },
  { department_id: 4, department_name: "Кафедра ИИ и анализа данных",    school_id: 2 },
];

// ── training_program ──────────────────────────────────────────
export const TRAINING_PROGRAMS = [
  { program_id: 1, program_name: "Информационные системы и технологии", degree_level: "BACHELOR", duration_years: 4, department_id: 1 },
  { program_id: 2, program_name: "Программная инженерия",               degree_level: "BACHELOR", duration_years: 4, department_id: 2 },
  { program_id: 3, program_name: "Прикладная математика и информатика", degree_level: "BACHELOR", duration_years: 4, department_id: 3 },
];

// ── curriculum ────────────────────────────────────────────────
export const CURRICULA = [
  { curriculum_id: 1, program_id: 1, year_number: 2, semester_number: 3 },
  { curriculum_id: 2, program_id: 2, year_number: 2, semester_number: 3 },
  { curriculum_id: 3, program_id: 3, year_number: 1, semester_number: 2 },
];

// ── subject ───────────────────────────────────────────────────
export const SUBJECTS = [
  { subject_id: 1, subject_name: "Базы данных" },
  { subject_id: 2, subject_name: "Алгоритмы и структуры данных" },
  { subject_id: 3, subject_name: "Математический анализ" },
  { subject_id: 4, subject_name: "Программирование на Python" },
  { subject_id: 5, subject_name: "Веб-разработка" },
  { subject_id: 6, subject_name: "Операционные системы" },
  { subject_id: 7, subject_name: "Сети и телекоммуникации" },
  { subject_id: 8, subject_name: "Дискретная математика" },
  { subject_id: 9, subject_name: "Безопасность жизнедеятельности" },
  { subject_id: 10, subject_name: "Иностранный язык" },
];

// ── curriculum_subject ────────────────────────────────────────
export const CURRICULUM_SUBJECTS = [
  { subj_id: 1, curriculum_id: 1, subject_id: 1, lecture_hours: 36, practice_hours: 0,  lab_hours: 36, report_type: "EXAM",   credit_units: 4 },
  { subj_id: 2, curriculum_id: 1, subject_id: 2, lecture_hours: 18, practice_hours: 18, lab_hours: 0,  report_type: "CREDIT", credit_units: 3 },
  { subj_id: 3, curriculum_id: 1, subject_id: 5, lecture_hours: 18, practice_hours: 0,  lab_hours: 36, report_type: "EXAM",   credit_units: 4 },
  { subj_id: 4, curriculum_id: 2, subject_id: 4, lecture_hours: 18, practice_hours: 18, lab_hours: 18, report_type: "EXAM",   credit_units: 4 },
  { subj_id: 5, curriculum_id: 2, subject_id: 6, lecture_hours: 36, practice_hours: 0,  lab_hours: 18, report_type: "CREDIT", credit_units: 3 },
  { subj_id: 6, curriculum_id: 3, subject_id: 3, lecture_hours: 54, practice_hours: 36, lab_hours: 0,  report_type: "EXAM",   credit_units: 6 },
  { subj_id: 7, curriculum_id: 3, subject_id: 8, lecture_hours: 36, practice_hours: 18, lab_hours: 0,  report_type: "CREDIT", credit_units: 4 },
  { subj_id: 8, curriculum_id: 1, subject_id: 9, lecture_hours: 18, practice_hours: 18, lab_hours: 0,  report_type: "CREDIT", credit_units: 2 },
  { subj_id: 9, curriculum_id: 1, subject_id: 10, lecture_hours: 0,  practice_hours: 72, lab_hours: 0, report_type: "CREDIT", credit_units: 4 },
];

// ── teacher ───────────────────────────────────────────────────
export const TEACHERS = [
  { teacher_id: 1, last_name: "Иванов",   first_name: "Алексей",  middle_name: "Петрович",   department_id: 1, academic_degree: "канд. наук", academic_rank: "доцент",    position: "доцент" },
  { teacher_id: 2, last_name: "Петрова",  first_name: "Мария",    middle_name: "Сергеевна",  department_id: 2, academic_degree: null,         academic_rank: null,        position: "ст. преподаватель" },
  { teacher_id: 3, last_name: "Сидоров",  first_name: "Дмитрий",  middle_name: "Игоревич",   department_id: 3, academic_degree: "д-р наук",   academic_rank: "профессор", position: "профессор" },
  { teacher_id: 4, last_name: "Козлова",  first_name: "Анна",     middle_name: "Владимировна",department_id: 1, academic_degree: "канд. наук", academic_rank: "доцент",    position: "доцент" },
  { teacher_id: 5, last_name: "Новиков",  first_name: "Сергей",   middle_name: "Михайлович", department_id: 2, academic_degree: null,         academic_rank: null,        position: "ассистент" },
  { teacher_id: 6, last_name: "Фёдорова", first_name: "Елена",    middle_name: "Юрьевна",    department_id: 4, academic_degree: "канд. наук", academic_rank: "доцент",    position: "доцент" },
];

export const teacherShortName = (t) =>
  `${t.last_name} ${t.first_name[0]}.${t.middle_name ? t.middle_name[0] + "." : ""}`;

// ── teacher_assignment ────────────────────────────────────────
export const TEACHER_ASSIGNMENTS = [
  { assignment_id: 1,  teacher_id: 1, subj_id: 1, lesson_types: "LEC,LAB" },
  { assignment_id: 2,  teacher_id: 4, subj_id: 1, lesson_types: "LAB" },
  { assignment_id: 3,  teacher_id: 2, subj_id: 2, lesson_types: "LEC,PRAC" },
  { assignment_id: 4,  teacher_id: 4, subj_id: 3, lesson_types: "LEC,LAB" },
  { assignment_id: 5,  teacher_id: 5, subj_id: 3, lesson_types: "LAB" },
  { assignment_id: 6,  teacher_id: 2, subj_id: 4, lesson_types: "LEC,PRAC,LAB" },
  { assignment_id: 7,  teacher_id: 5, subj_id: 5, lesson_types: "LEC,LAB" },
  { assignment_id: 8,  teacher_id: 3, subj_id: 6, lesson_types: "LEC,PRAC" },
  { assignment_id: 9,  teacher_id: 1, subj_id: 7, lesson_types: "LEC,PRAC" },
  { assignment_id: 10, teacher_id: 3, subj_id: 8, lesson_types: "LEC,PRAC" },
  { assignment_id: 11, teacher_id: 6, subj_id: 9, lesson_types: "LEC,PRAC" },
  { assignment_id: 12, teacher_id: 2, subj_id: 9, lesson_types: "PRAC" },
];

// ── academic_group ────────────────────────────────────────────
export const ACADEMIC_GROUPS = [
  { group_id: 1, group_name: "Б24-ИСТ-1", program_id: 1, year_of_enrollment: 2024 },
  { group_id: 2, group_name: "Б24-ИСТ-2", program_id: 1, year_of_enrollment: 2024 },
  { group_id: 3, group_name: "Б24-ПИ-1",  program_id: 2, year_of_enrollment: 2024 },
  { group_id: 4, group_name: "Б24-ПМИ-1", program_id: 3, year_of_enrollment: 2024 },
];

// ── study_group ───────────────────────────────────────────────
export const STUDY_GROUPS = [
  { study_group_id: 1, study_group_name: "Б24-ИСТ-1",      group_type: "FULL",     student_count: 25, academic_group_id: 1 },
  { study_group_id: 2, study_group_name: "Б24-ИСТ-1 (п/г 1)", group_type: "SUBGROUP", student_count: 13, academic_group_id: 1 },
  { study_group_id: 3, study_group_name: "Б24-ИСТ-1 (п/г 2)", group_type: "SUBGROUP", student_count: 12, academic_group_id: 1 },
  { study_group_id: 4, study_group_name: "Б24-ИСТ-2",      group_type: "FULL",     student_count: 23, academic_group_id: 2 },
  { study_group_id: 5, study_group_name: "Б24-ПИ-1",       group_type: "FULL",     student_count: 28, academic_group_id: 3 },
  { study_group_id: 6, study_group_name: "Б24-ПМИ-1",      group_type: "FULL",     student_count: 20, academic_group_id: 4 },
  { study_group_id: 7, study_group_name: "Поток ИСТ",      group_type: "STREAM",   student_count: 48, academic_group_id: 1 },
];

// ── building ──────────────────────────────────────────────────
export const BUILDINGS = [
  { building_id: 1, building_name: "Корпус А", address: "ул. Суханова, 8" },
  { building_id: 2, building_name: "Корпус Б", address: "ул. Суханова, 8а" },
  { building_id: 3, building_name: "Корпус В", address: "ул. Октябрьская, 27" },
];

export const BUILDING_DISTANCES = [
  { from_building_id: 1, to_building_id: 2, travel_minutes: 5  },
  { from_building_id: 2, to_building_id: 1, travel_minutes: 5  },
  { from_building_id: 1, to_building_id: 3, travel_minutes: 15 },
  { from_building_id: 3, to_building_id: 1, travel_minutes: 15 },
  { from_building_id: 2, to_building_id: 3, travel_minutes: 12 },
  { from_building_id: 3, to_building_id: 2, travel_minutes: 12 },
];

// ── room ──────────────────────────────────────────────────────
export const ROOMS = [
  { room_id: 1, room_number: "101",  room_type: "LECTURE",    capacity: 80,  building_id: 1, is_online: false },
  { room_id: 2, room_number: "102",  room_type: "SEMINAR",    capacity: 30,  building_id: 1, is_online: false },
  { room_id: 3, room_number: "201",  room_type: "LABORATORY", capacity: 16,  building_id: 1, is_online: false },
  { room_id: 4, room_number: "202",  room_type: "COMPUTER",   capacity: 20,  building_id: 1, is_online: false },
  { room_id: 5, room_number: "301",  room_type: "HALL",       capacity: 200, building_id: 2, is_online: false },
  { room_id: 6, room_number: "105",  room_type: "LABORATORY", capacity: 14,  building_id: 2, is_online: false },
  { room_id: 7, room_number: "203",  room_type: "SEMINAR",    capacity: 28,  building_id: 2, is_online: false },
  { room_id: 8, room_number: "Online", room_type: "LECTURE",  capacity: 999, building_id: 1, is_online: true  },
];

export const ROOM_TYPE_LABELS = {
  LECTURE:    "Лекционная",
  SEMINAR:    "Семинарская",
  LABORATORY: "Лаборатория",
  COMPUTER:   "Комп. класс",
  HALL:       "Актовый зал",
};

// ── schedule (семестр) ────────────────────────────────────────
export const SCHEDULES = [
  {
    schedule_id: 1,
    schedule_name: "Расписание 2025/26 — Весенний семестр",
    curriculum_id: 1,
    academic_year: 2025,
    semester_number: 4,
    date_start: "2025-02-10",
    date_end:   "2025-06-30",
    week_count: 18,
    is_active: true,
  },
];

// ── lesson_type labels & colors ───────────────────────────────
export const LESSON_TYPES = {
  LEC:    { label: "Лекция",         color: "#4285F4", bg: "#4285F415" },
  PRAC:   { label: "Практика",       color: "#0F9D58", bg: "#0F9D5815" },
  LAB:    { label: "Лаб. работа",    color: "#F4B400", bg: "#F4B40015" },
  EXAM:   { label: "Экзамен",        color: "#DB4437", bg: "#DB443715" },
  CREDIT: { label: "Зачёт",          color: "#E65100", bg: "#E6510015" },
  CONSUL: { label: "Консультация",   color: "#673AB7", bg: "#673AB715" },
};

// ── lesson ────────────────────────────────────────────────────
// lesson.week_parity: 'ODD' | 'EVEN' | 'BOTH'  (как в БД)
export const LESSONS = [
  // ПН
  { lesson_id:  1, schedule_id:1, study_group_id:7, subj_id:1,  assignment_id:1,  room_id:1, slot_id:1, lesson_type:"LEC",  day_of_week:1, week_parity:"BOTH", is_recurring:true },
  { lesson_id:  2, schedule_id:1, study_group_id:2, subj_id:1,  assignment_id:2,  room_id:3, slot_id:2, lesson_type:"LAB",  day_of_week:1, week_parity:"ODD",  is_recurring:true },
  { lesson_id:  3, schedule_id:1, study_group_id:3, subj_id:1,  assignment_id:2,  room_id:4, slot_id:2, lesson_type:"LAB",  day_of_week:1, week_parity:"EVEN", is_recurring:true },
  { lesson_id:  4, schedule_id:1, study_group_id:4, subj_id:9,  assignment_id:12, room_id:2, slot_id:3, lesson_type:"PRAC", day_of_week:1, week_parity:"BOTH", is_recurring:true },
  { lesson_id:  5, schedule_id:1, study_group_id:5, subj_id:4,  assignment_id:6,  room_id:7, slot_id:4, lesson_type:"LEC",  day_of_week:1, week_parity:"BOTH", is_recurring:true },
  { lesson_id:  6, schedule_id:1, study_group_id:6, subj_id:7,  assignment_id:10, room_id:1, slot_id:5, lesson_type:"PRAC", day_of_week:1, week_parity:"EVEN", is_recurring:true },
  // ВТ
  { lesson_id:  7, schedule_id:1, study_group_id:1, subj_id:2,  assignment_id:3,  room_id:1, slot_id:1, lesson_type:"LEC",  day_of_week:2, week_parity:"BOTH", is_recurring:true },
  { lesson_id:  8, schedule_id:1, study_group_id:4, subj_id:5,  assignment_id:7,  room_id:3, slot_id:2, lesson_type:"LAB",  day_of_week:2, week_parity:"BOTH", is_recurring:true },
  { lesson_id:  9, schedule_id:1, study_group_id:5, subj_id:4,  assignment_id:6,  room_id:4, slot_id:3, lesson_type:"LAB",  day_of_week:2, week_parity:"ODD",  is_recurring:true },
  { lesson_id: 10, schedule_id:1, study_group_id:6, subj_id:6,  assignment_id:8,  room_id:5, slot_id:4, lesson_type:"LEC",  day_of_week:2, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 11, schedule_id:1, study_group_id:1, subj_id:9,  assignment_id:12, room_id:2, slot_id:5, lesson_type:"PRAC", day_of_week:2, week_parity:"BOTH", is_recurring:true },
  // СР
  { lesson_id: 12, schedule_id:1, study_group_id:7, subj_id:3,  assignment_id:4,  room_id:1, slot_id:1, lesson_type:"LEC",  day_of_week:3, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 13, schedule_id:1, study_group_id:5, subj_id:5,  assignment_id:7,  room_id:3, slot_id:2, lesson_type:"LAB",  day_of_week:3, week_parity:"EVEN", is_recurring:true },
  { lesson_id: 14, schedule_id:1, study_group_id:4, subj_id:9,  assignment_id:11, room_id:2, slot_id:3, lesson_type:"PRAC", day_of_week:3, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 15, schedule_id:1, study_group_id:6, subj_id:7,  assignment_id:9,  room_id:7, slot_id:4, lesson_type:"LEC",  day_of_week:3, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 16, schedule_id:1, study_group_id:1, subj_id:2,  assignment_id:3,  room_id:2, slot_id:5, lesson_type:"PRAC", day_of_week:3, week_parity:"ODD",  is_recurring:true },
  // ЧТ
  { lesson_id: 17, schedule_id:1, study_group_id:2, subj_id:1,  assignment_id:2,  room_id:4, slot_id:1, lesson_type:"LAB",  day_of_week:4, week_parity:"ODD",  is_recurring:true },
  { lesson_id: 18, schedule_id:1, study_group_id:3, subj_id:1,  assignment_id:2,  room_id:3, slot_id:1, lesson_type:"LAB",  day_of_week:4, week_parity:"EVEN", is_recurring:true },
  { lesson_id: 19, schedule_id:1, study_group_id:5, subj_id:5,  assignment_id:7,  room_id:7, slot_id:2, lesson_type:"LEC",  day_of_week:4, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 20, schedule_id:1, study_group_id:6, subj_id:6,  assignment_id:8,  room_id:5, slot_id:3, lesson_type:"PRAC", day_of_week:4, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 21, schedule_id:1, study_group_id:4, subj_id:4,  assignment_id:6,  room_id:4, slot_id:4, lesson_type:"LAB",  day_of_week:4, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 22, schedule_id:1, study_group_id:1, subj_id:8,  assignment_id:9,  room_id:2, slot_id:5, lesson_type:"PRAC", day_of_week:4, week_parity:"EVEN", is_recurring:true },
  // ПТ
  { lesson_id: 23, schedule_id:1, study_group_id:7, subj_id:3,  assignment_id:4,  room_id:1, slot_id:1, lesson_type:"PRAC", day_of_week:5, week_parity:"ODD",  is_recurring:true },
  { lesson_id: 24, schedule_id:1, study_group_id:6, subj_id:8,  assignment_id:10, room_id:5, slot_id:2, lesson_type:"LEC",  day_of_week:5, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 25, schedule_id:1, study_group_id:4, subj_id:5,  assignment_id:7,  room_id:6, slot_id:3, lesson_type:"LAB",  day_of_week:5, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 26, schedule_id:1, study_group_id:1, subj_id:1,  assignment_id:1,  room_id:3, slot_id:4, lesson_type:"LAB",  day_of_week:5, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 27, schedule_id:1, study_group_id:5, subj_id:4,  assignment_id:6,  room_id:4, slot_id:5, lesson_type:"PRAC", day_of_week:5, week_parity:"EVEN", is_recurring:true },
  // СБ
  { lesson_id: 28, schedule_id:1, study_group_id:4, subj_id:9,  assignment_id:11, room_id:2, slot_id:1, lesson_type:"LEC",  day_of_week:6, week_parity:"BOTH", is_recurring:true },
  { lesson_id: 29, schedule_id:1, study_group_id:6, subj_id:6,  assignment_id:8,  room_id:7, slot_id:2, lesson_type:"PRAC", day_of_week:6, week_parity:"ODD",  is_recurring:true },
];

// ── session events (экзамены, зачёты, консультации) ───────────
// Для них is_recurring=false, specific_date заполнена, day_of_week=null
export const SESSION_LESSONS = [
  { lesson_id:101, schedule_id:1, study_group_id:1, subj_id:1, assignment_id:1,  room_id:1, slot_id:1, lesson_type:"CONSUL", day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-05" },
  { lesson_id:102, schedule_id:1, study_group_id:1, subj_id:1, assignment_id:1,  room_id:5, slot_id:3, lesson_type:"EXAM",   day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-12" },
  { lesson_id:103, schedule_id:1, study_group_id:4, subj_id:2, assignment_id:3,  room_id:2, slot_id:2, lesson_type:"CREDIT", day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-14" },
  { lesson_id:104, schedule_id:1, study_group_id:5, subj_id:4, assignment_id:6,  room_id:1, slot_id:4, lesson_type:"CONSUL", day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-15" },
  { lesson_id:105, schedule_id:1, study_group_id:5, subj_id:4, assignment_id:6,  room_id:5, slot_id:1, lesson_type:"EXAM",   day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-18" },
  { lesson_id:106, schedule_id:1, study_group_id:6, subj_id:6, assignment_id:8,  room_id:5, slot_id:3, lesson_type:"EXAM",   day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-20" },
  { lesson_id:107, schedule_id:1, study_group_id:4, subj_id:5, assignment_id:7,  room_id:7, slot_id:2, lesson_type:"CREDIT", day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-22" },
  { lesson_id:108, schedule_id:1, study_group_id:1, subj_id:2, assignment_id:3,  room_id:2, slot_id:1, lesson_type:"CONSUL", day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-24" },
  { lesson_id:109, schedule_id:1, study_group_id:7, subj_id:3, assignment_id:4,  room_id:5, slot_id:3, lesson_type:"EXAM",   day_of_week:null, week_parity:"BOTH", is_recurring:false, specific_date:"2025-06-27" },
];

// ── helper: обогатить lesson всеми связями ────────────────────
export function enrichLesson(lesson) {
  const assignment  = TEACHER_ASSIGNMENTS.find(a => a.assignment_id === lesson.assignment_id);
  const teacher     = assignment ? TEACHERS.find(t => t.teacher_id === assignment.teacher_id) : null;
  const currSubject = CURRICULUM_SUBJECTS.find(s => s.subj_id === lesson.subj_id);
  const subject     = currSubject ? SUBJECTS.find(s => s.subject_id === currSubject.subject_id) : null;
  const studyGroup  = STUDY_GROUPS.find(g => g.study_group_id === lesson.study_group_id);
  const room        = ROOMS.find(r => r.room_id === lesson.room_id);
  const building    = room ? BUILDINGS.find(b => b.building_id === room.building_id) : null;
  const slot        = SLOTS.find(s => s.slot_id === lesson.slot_id);
  const day         = lesson.day_of_week ? DAYS_OF_WEEK.find(d => d.id === lesson.day_of_week) : null;
  const typeInfo    = LESSON_TYPES[lesson.lesson_type] || { label: lesson.lesson_type, color: "#888", bg: "#88888815" };

  return {
    ...lesson,
    teacher,
    teacherShort: teacher ? teacherShortName(teacher) : "—",
    subject,
    subjectName: subject?.subject_name || "—",
    studyGroup,
    groupName: studyGroup?.study_group_name || "—",
    room,
    roomLabel: room ? `${building?.building_name} — ${room.room_number}` : "—",
    building,
    slot,
    day,
    typeInfo,
  };
}

// ── filter helpers ────────────────────────────────────────────
export function filterLessons({ studyGroupId, teacherId, roomId, dayOfWeek, weekParity }) {
  return LESSONS.filter(l => {
    if (studyGroupId && l.study_group_id !== studyGroupId) return false;
    if (teacherId) {
      const a = TEACHER_ASSIGNMENTS.find(a => a.assignment_id === l.assignment_id);
      if (!a || a.teacher_id !== teacherId) return false;
    }
    if (roomId && l.room_id !== roomId) return false;
    if (dayOfWeek && l.day_of_week !== dayOfWeek) return false;
    if (weekParity && l.week_parity !== "BOTH" && l.week_parity !== weekParity) return false;
    return true;
  }).map(enrichLesson);
}

export function filterSessionLessons({ studyGroupId, teacherId, lessonType }) {
  return SESSION_LESSONS.filter(l => {
    if (studyGroupId && l.study_group_id !== studyGroupId) return false;
    if (teacherId) {
      const a = TEACHER_ASSIGNMENTS.find(a => a.assignment_id === l.assignment_id);
      if (!a || a.teacher_id !== teacherId) return false;
    }
    if (lessonType && l.lesson_type !== lessonType) return false;
    return true;
  }).map(enrichLesson);
}
