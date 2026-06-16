# План разработки: «Расписание учебных занятий»

---

## Стек технологий

| Слой | Технология |
|---|---|
| Backend | Node.js + Express |
| БД | PostgreSQL |
| ORM | Prisma |
| Frontend | React + Vite |
| Стили | Tailwind CSS |
| Авторизация | JWT (jsonwebtoken) |
| Документация API | Swagger (swagger-ui-express) |
| Тестирование | Jest + Supertest (API), Playwright (E2E) |
| Контейнеризация | Docker + docker-compose |
| Контроль версий | Git + GitHub |

---

## Структура монорепозитория

```
schedule-project/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # схема БД
│   ├── src/
│   │   ├── controllers/           # обработчики запросов
│   │   ├── routes/                # маршруты Express
│   │   ├── services/              # бизнес-логика
│   │   ├── middleware/            # auth, validation, error
│   │   ├── validators/            # joi / zod схемы
│   │   └── app.js                 # точка входа
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/             # страница администратора
│   │   │   └── user/              # страница пользователя
│   │   ├── components/
│   │   │   ├── schedule/          # сетка расписания, шахматка
│   │   │   ├── filters/           # панели фильтров
│   │   │   ├── forms/             # формы справочников
│   │   │   └── reports/           # компоненты отчётов
│   │   ├── api/                   # axios-клиент, API-функции
│   │   ├── store/                 # Zustand / Context
│   │   └── main.jsx
│   └── package.json
│
├── docs/
│   └── report/                    # разделы отчёта
│
└── docker-compose.yml
```

---

## Схема базы данных (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Подразделения (иерархия: Университет → Школа → Кафедра)
model Department {
  id         Int          @id @default(autoincrement())
  name       String       @unique
  parentId   Int?
  parent     Department?  @relation("DeptHierarchy", fields: [parentId], references: [id])
  children   Department[] @relation("DeptHierarchy")
  teachers   Teacher[]
  createdAt  DateTime     @default(now())
}

// Преподаватели
model Teacher {
  id           Int          @id @default(autoincrement())
  fullName     String
  departmentId Int
  department   Department   @relation(fields: [departmentId], references: [id])
  // дисциплины, которые может вести преподаватель
  courses      TeacherCourse[]
  lessons      Lesson[]
}

// Корпуса университета
model Building {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  // расстояния до других корпусов в метрах (матрица хранится отдельно)
  rooms     Room[]
  distances BuildingDistance[] @relation("FromBuilding")
}

// Расстояния между корпусами (минуты перемещения)
model BuildingDistance {
  fromId      Int
  toId        Int
  minutes     Int
  from        Building @relation("FromBuilding", fields: [fromId], references: [id])
  @@id([fromId, toId])
}

// Учебные помещения
model Room {
  id         Int       @id @default(autoincrement())
  name       String    @unique          // например: А-101
  type       RoomType
  capacity   Int
  buildingId Int
  building   Building  @relation(fields: [buildingId], references: [id])
  lessons    Lesson[]
}

enum RoomType {
  LECTURE       // лекционная аудитория
  SEMINAR       // аудитория для практических занятий
  LABORATORY    // лаборатория
  COMPUTER      // компьютерный класс
}

// Направления подготовки
model TrainingProgram {
  id          Int              @id @default(autoincrement())
  name        String           @unique
  groups      AcademicGroup[]
  curriculum  CurriculumItem[]
}

// Академические группы
model AcademicGroup {
  id          Int              @id @default(autoincrement())
  name        String           @unique
  programId   Int
  program     TrainingProgram  @relation(fields: [programId], references: [id])
  studyGroups StudyGroup[]     // подгруппы или потоки
}

// Учебные группы (подгруппы / потоки / целая академическая группа)
model StudyGroup {
  id               Int           @id @default(autoincrement())
  name             String        @unique
  studentCount     Int
  academicGroupId  Int
  academicGroup    AcademicGroup @relation(fields: [academicGroupId], references: [id])
  lessons          Lesson[]
}

// Учебный план на семестр (дисциплины)
model CurriculumItem {
  id           Int             @id @default(autoincrement())
  name         String
  programId    Int
  program      TrainingProgram @relation(fields: [programId], references: [id])
  semester     Int
  lectureHours Int             @default(0)
  practiceHours Int            @default(0)
  labHours     Int             @default(0)
  reportType   ReportType      // EXAM или CREDIT
  teachers     TeacherCourse[]
  lessons      Lesson[]
}

enum ReportType {
  EXAM    // экзамен
  CREDIT  // зачёт
}

// Связь преподаватель ↔ дисциплина (с типами занятий)
model TeacherCourse {
  id               Int           @id @default(autoincrement())
  teacherId        Int
  curriculumItemId Int
  canTeachLecture  Boolean       @default(false)
  canTeachPractice Boolean       @default(false)
  canTeachLab      Boolean       @default(false)
  teacher          Teacher       @relation(fields: [teacherId], references: [id])
  curriculum       CurriculumItem @relation(fields: [curriculumItemId], references: [id])
  @@unique([teacherId, curriculumItemId])
}

// Расписание (семестровый экземпляр)
model Schedule {
  id          Int      @id @default(autoincrement())
  name        String   // например: «Осень 2024»
  semesterWeeks Int    // количество учебных недель (≥ 18)
  isActive    Boolean  @default(false)
  copiedFromId Int?    // ссылка на расписание-источник при копировании
  lessons     Lesson[]
  createdAt   DateTime @default(now())
}

// Элемент расписания — одно занятие
model Lesson {
  id               Int           @id @default(autoincrement())
  scheduleId       Int
  schedule         Schedule      @relation(fields: [scheduleId], references: [id])
  studyGroupId     Int
  studyGroup       StudyGroup    @relation(fields: [studyGroupId], references: [id])
  curriculumItemId Int
  curriculumItem   CurriculumItem @relation(fields: [curriculumItemId], references: [id])
  teacherId        Int
  teacher          Teacher       @relation(fields: [teacherId], references: [id])
  roomId           Int
  room             Room          @relation(fields: [roomId], references: [id])
  lessonType       LessonType
  dayOfWeek        Int           // 1 (пн) – 6 (сб)
  slotNumber       Int           // 1–8 (номер пары по расписанию звонков)
  // Для зачётов / экзаменов / консультаций — конкретная дата
  specificDate     DateTime?
  isRecurring      Boolean       @default(true) // еженедельно или разово
}

enum LessonType {
  LECTURE       // лекция
  PRACTICE      // практика / семинар
  LAB           // лабораторная работа
  EXAM          // экзамен (20 мин × кол-во студентов)
  CREDIT        // зачёт (10 мин × кол-во студентов)
  CONSULTATION  // консультация (2 ак. часа)
}
```

---

## Расписание звонков (справочник, хранится в коде)

```javascript
// backend/src/constants/slots.js
const SLOTS = [
  { number: 1, start: "08:30", end: "10:00" },
  { number: 2, start: "10:10", end: "11:40" },
  { number: 3, start: "11:50", end: "13:20" },
  { number: 4, start: "13:30", end: "15:00" },
  { number: 5, start: "15:10", end: "16:40" },
  { number: 6, start: "16:50", end: "18:20" },
  { number: 7, start: "18:30", end: "19:00" },
  { number: 8, start: "19:10", end: "20:40" },
];
module.exports = SLOTS;
```

---

## Backend: основные файлы и логика

### app.js
```javascript
const express = require("express");
const cors = require("cors");
const { authRouter } = require("./routes/auth");
const { scheduleRouter } = require("./routes/schedule");
const { referencesRouter } = require("./routes/references");
const { reportsRouter } = require("./routes/reports");
const { errorHandler } = require("./middleware/errorHandler");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/auth", authRouter);
app.use("/api/schedule", scheduleRouter);
app.use("/api/refs", referencesRouter);       // справочники
app.use("/api/reports", reportsRouter);
app.use(errorHandler);

module.exports = app;
```

### routes/schedule.js
```javascript
const router = require("express").Router();
const { authMiddleware, adminOnly } = require("../middleware/auth");
const ctrl = require("../controllers/scheduleController");

router.get("/",            ctrl.listSchedules);
router.get("/:id",         ctrl.getSchedule);
router.post("/",           authMiddleware, adminOnly, ctrl.createSchedule);
router.post("/:id/copy",   authMiddleware, adminOnly, ctrl.copySchedule);
router.put("/:id",         authMiddleware, adminOnly, ctrl.updateSchedule);
router.delete("/:id",      authMiddleware, adminOnly, ctrl.deleteSchedule);

// занятия внутри расписания
router.get("/:id/lessons",       ctrl.getLessons);
router.post("/:id/lessons",      authMiddleware, adminOnly, ctrl.addLesson);
router.put("/:id/lessons/:lid",  authMiddleware, adminOnly, ctrl.updateLesson);
router.delete("/:id/lessons/:lid", authMiddleware, adminOnly, ctrl.deleteLesson);

module.exports = { scheduleRouter: router };
```

### services/conflictChecker.js — проверка всех ограничений ТЗ
```javascript
const prisma = require("../db");
const SLOTS = require("../constants/slots");

/**
 * Проверяет новое занятие на все ограничения.
 * Возвращает массив нарушений (пустой — если всё чисто).
 */
async function checkConflicts(lesson, scheduleId) {
  const errors = [];
  const { studyGroupId, teacherId, roomId, dayOfWeek, slotNumber,
          lessonType, specificDate, isRecurring } = lesson;

  // Условие совпадения по времени для повторяющихся занятий
  const timeMatch = isRecurring
    ? { dayOfWeek, slotNumber }
    : { specificDate };

  // 1. Группа не может быть в двух местах одновременно
  const groupConflict = await prisma.lesson.findFirst({
    where: { scheduleId, studyGroupId, ...timeMatch }
  });
  if (groupConflict) errors.push("Группа уже занята в это время");

  // 2. Преподаватель не может вести два занятия одновременно
  const teacherConflict = await prisma.lesson.findFirst({
    where: { scheduleId, teacherId, ...timeMatch }
  });
  if (teacherConflict) errors.push("Преподаватель занят в это время");

  // 3. Помещение занято
  const roomConflict = await prisma.lesson.findFirst({
    where: { scheduleId, roomId, ...timeMatch }
  });
  if (roomConflict) errors.push("Помещение занято в это время");

  // 4. Вместимость помещения
  const room = await prisma.room.findUnique({ where: { id: roomId } });
  const group = await prisma.studyGroup.findUnique({ where: { id: studyGroupId } });
  if (room && group && group.studentCount > room.capacity) {
    errors.push(`Помещение вмещает ${room.capacity}, в группе ${group.studentCount}`);
  }

  // 5. Тип помещения для лабораторных
  if (lessonType === "LAB") {
    if (!["LABORATORY", "COMPUTER"].includes(room?.type)) {
      errors.push("Лабораторные занятия требуют лабораторию или компьютерный класс");
    }
  }

  // 6. Ограничение 5 пар в день для группы
  const groupDayLessons = await prisma.lesson.count({
    where: { scheduleId, studyGroupId, dayOfWeek }
  });
  if (groupDayLessons >= 5) {
    errors.push("Для группы превышен лимит 5 пар в день");
  }

  // 7. Ограничение 5 пар в день для преподавателя
  const teacherDayLessons = await prisma.lesson.count({
    where: { scheduleId, teacherId, dayOfWeek }
  });
  if (teacherDayLessons >= 5) {
    errors.push("Для преподавателя превышен лимит 5 пар в день");
  }

  // 8. Время перемещения между корпусами (для двух соседних занятий)
  const prevLesson = await prisma.lesson.findFirst({
    where: { scheduleId, studyGroupId, dayOfWeek, slotNumber: slotNumber - 1 },
    include: { room: { include: { building: true } } }
  });
  if (prevLesson && prevLesson.room.buildingId !== room.buildingId) {
    const distance = await prisma.buildingDistance.findUnique({
      where: { fromId_toId: { fromId: prevLesson.room.buildingId, toId: room.buildingId } }
    });
    const breakBetween = getBreakMinutes(slotNumber - 1, slotNumber);
    if (distance && distance.minutes > breakBetween) {
      errors.push(`Недостаточно времени на переход между корпусами (нужно ${distance.minutes} мин, есть ${breakBetween} мин)`);
    }
  }

  return errors;
}

// Вычисляет перерыв в минутах между двумя парами
function getBreakMinutes(slotA, slotB) {
  const SLOTS = require("../constants/slots");
  const a = SLOTS.find(s => s.number === slotA);
  const b = SLOTS.find(s => s.number === slotB);
  if (!a || !b) return 0;
  const endA = timeToMinutes(a.end);
  const startB = timeToMinutes(b.start);
  return startB - endA;
}

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

module.exports = { checkConflicts };
```

### services/reportService.js — формирование данных для отчётов
```javascript
const prisma = require("../db");

// Расписание одной группы
async function getGroupSchedule(scheduleId, studyGroupId) {
  return prisma.lesson.findMany({
    where: { scheduleId, studyGroupId },
    include: { teacher: true, room: { include: { building: true } },
               curriculumItem: true, studyGroup: true },
    orderBy: [{ dayOfWeek: "asc" }, { slotNumber: "asc" }]
  });
}

// Расписание консультаций, зачётов и экзаменов
async function getExamSchedule(scheduleId, studyGroupIds) {
  return prisma.lesson.findMany({
    where: {
      scheduleId,
      studyGroupId: { in: studyGroupIds },
      lessonType: { in: ["EXAM", "CREDIT", "CONSULTATION"] }
    },
    include: { teacher: true, room: true, curriculumItem: true, studyGroup: true },
    orderBy: [{ specificDate: "asc" }]
  });
}

// План занятости преподавателей подразделения
async function getDepartmentLoad(scheduleId, departmentId) {
  return prisma.lesson.findMany({
    where: { scheduleId, teacher: { departmentId } },
    include: { teacher: true, curriculumItem: true, room: true, studyGroup: true },
    orderBy: [{ teacher: { fullName: "asc" } }, { dayOfWeek: "asc" }]
  });
}

// Загрузка помещений
async function getRoomLoad(scheduleId) {
  return prisma.lesson.findMany({
    where: { scheduleId },
    include: { room: { include: { building: true } }, studyGroup: true,
               curriculumItem: true, teacher: true },
    orderBy: [{ room: { type: "asc" } }, { dayOfWeek: "asc" }]
  });
}

module.exports = { getGroupSchedule, getExamSchedule, getDepartmentLoad, getRoomLoad };
```

---

## Frontend: основные файлы и логика

### Структура страниц

```
src/pages/
├── admin/
│   ├── AdminLayout.jsx          # боковое меню, навигация
│   ├── DepartmentsPage.jsx      # ведение подразделений
│   ├── CurriculumPage.jsx       # учебные планы
│   ├── TeachersPage.jsx         # преподаватели
│   ├── RoomsPage.jsx            # учебные помещения
│   ├── GroupsPage.jsx           # учебные группы
│   └── ScheduleEditorPage.jsx   # редактор расписания
│
└── user/
    ├── UserLayout.jsx
    ├── ScheduleViewPage.jsx     # просмотр расписания с фильтрами
    ├── ExamSchedulePage.jsx     # зачёты / экзамены / консультации
    └── RoomLoadPage.jsx         # загрузка помещений
```

### api/scheduleApi.js — централизованный HTTP-клиент
```javascript
import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL });

// Автоматически прикрепляет JWT
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

export const getLessons = (scheduleId, params) =>
  api.get(`/schedule/${scheduleId}/lessons`, { params });

export const addLesson = (scheduleId, data) =>
  api.post(`/schedule/${scheduleId}/lessons`, data);

export const updateLesson = (scheduleId, lessonId, data) =>
  api.put(`/schedule/${scheduleId}/lessons/${lessonId}`, data);

export const deleteLesson = (scheduleId, lessonId) =>
  api.delete(`/schedule/${scheduleId}/lessons/${lessonId}`);

export const copySchedule = (scheduleId) =>
  api.post(`/schedule/${scheduleId}/copy`);

export const getGroupSchedule = (scheduleId, groupId) =>
  api.get(`/reports/group`, { params: { scheduleId, groupId } });

export const getRoomLoad = (scheduleId) =>
  api.get(`/reports/rooms`, { params: { scheduleId } });
```

### components/schedule/WeekGrid.jsx — сетка расписания
```jsx
// Отображает занятия в виде таблицы: строки = пары, столбцы = дни недели
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const SLOTS_TIMES = ["8:30","10:10","11:50","13:30","15:10","16:50","18:30","19:10"];

export function WeekGrid({ lessons }) {
  // Строим карту: dayOfWeek → slotNumber → lesson
  const grid = {};
  lessons.forEach(l => {
    if (!grid[l.dayOfWeek]) grid[l.dayOfWeek] = {};
    grid[l.dayOfWeek][l.slotNumber] = l;
  });

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr>
          <th className="border p-2 bg-gray-50">Пара</th>
          {DAYS.map((d, i) => (
            <th key={i} className="border p-2 bg-gray-50">{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {SLOTS_TIMES.map((time, si) => (
          <tr key={si}>
            <td className="border p-2 text-center text-gray-500 text-xs">
              <span className="font-medium">{si + 1}</span><br/>{time}
            </td>
            {DAYS.map((_, di) => {
              const lesson = grid[di + 1]?.[si + 1];
              return (
                <td key={di} className="border p-1 align-top min-h-16">
                  {lesson && <LessonCell lesson={lesson} />}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### pages/user/ScheduleViewPage.jsx — страница пользователя
```jsx
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getLessons } from "../../api/scheduleApi";
import { WeekGrid } from "../../components/schedule/WeekGrid";
import { FilterPanel } from "../../components/filters/FilterPanel";

export default function ScheduleViewPage() {
  const [filters, setFilters] = useState({
    scheduleId: null, groupId: null, teacherId: null, roomId: null
  });

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ["lessons", filters],
    queryFn: () => getLessons(filters.scheduleId, filters).then(r => r.data),
    enabled: !!filters.scheduleId
  });

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Расписание занятий</h1>
      <FilterPanel value={filters} onChange={setFilters} />
      {isLoading ? (
        <p className="text-gray-400 mt-8">Загрузка...</p>
      ) : (
        <WeekGrid lessons={lessons} />
      )}
    </div>
  );
}
```

### pages/admin/ScheduleEditorPage.jsx — редактор расписания
```jsx
import { useState } from "react";
import { WeekGrid } from "../../components/schedule/WeekGrid";
import { LessonFormModal } from "../../components/forms/LessonFormModal";
import { addLesson, copySchedule } from "../../api/scheduleApi";

export default function ScheduleEditorPage() {
  const [selectedSlot, setSelectedSlot] = useState(null); // { dayOfWeek, slotNumber }
  const [conflicts, setConflicts] = useState([]);

  const handleSaveLesson = async (data) => {
    const res = await addLesson(scheduleId, data);
    if (res.data.conflicts?.length) {
      setConflicts(res.data.conflicts); // показываем список конфликтов
    }
  };

  return (
    <div className="p-6">
      <div className="flex gap-3 mb-4">
        <h1 className="text-xl font-semibold flex-1">Редактор расписания</h1>
        <button onClick={() => copySchedule(scheduleId)}>
          Копировать расписание
        </button>
      </div>
      {conflicts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          {conflicts.map((c, i) => <p key={i} className="text-red-700 text-sm">{c}</p>)}
        </div>
      )}
      <WeekGrid lessons={lessons} onSlotClick={setSelectedSlot} editable />
      {selectedSlot && (
        <LessonFormModal slot={selectedSlot} onSave={handleSaveLesson}
                         onClose={() => setSelectedSlot(null)} />
      )}
    </div>
  );
}
```

---

## Участник 1 — Team Lead / Backend

### Полный план работы

**Неделя 1–2 — Проектирование**
- [ ] Установить и настроить Docker + PostgreSQL + Node.js
- [ ] Инициализировать репозиторий, настроить ветки (`main`, `dev`, feature-ветки)
- [ ] Написать `prisma/schema.prisma` (все таблицы по ТЗ)
- [ ] Запустить `prisma migrate dev --name init`
- [ ] Написать seed-скрипт с тестовыми данными (`prisma/seed.js`)

**Неделя 3–4 — Справочники API**
- [ ] `GET/POST/PUT/DELETE /api/refs/departments` — подразделения
- [ ] `GET/POST/PUT/DELETE /api/refs/teachers` — преподаватели
- [ ] `GET/POST/PUT/DELETE /api/refs/rooms` — помещения
- [ ] `GET/POST/PUT/DELETE /api/refs/groups` — учебные группы
- [ ] `GET/POST/PUT/DELETE /api/refs/curriculum` — учебные планы
- [ ] JWT-авторизация (`/api/auth/login`, `middleware/auth.js`)
- [ ] Swagger-документация для всех эндпоинтов

**Неделя 5–6 — Расписание и ограничения**
- [ ] `POST /api/schedule` — создание расписания
- [ ] `POST /api/schedule/:id/copy` — копирование
- [ ] `POST /api/schedule/:id/lessons` — добавление занятия
- [ ] Интеграция `conflictChecker.js` в контроллер (ответ с массивом `conflicts`)
- [ ] `PUT /api/schedule/:id/lessons/:lid` — редактирование
- [ ] `DELETE /api/schedule/:id/lessons/:lid`

**Неделя 7 — Отчёты и финализация**
- [ ] `GET /api/reports/group` — расписание группы
- [ ] `GET /api/reports/chess` — шахматная ведомость
- [ ] `GET /api/reports/exams` — зачёты/экзамены
- [ ] `GET /api/reports/teacher-load` — занятость преподавателей
- [ ] `GET /api/reports/room-load` — загрузка помещений
- [ ] Code review всех PR команды

**Файлы-ответственность:**
`prisma/schema.prisma`, `src/app.js`, `src/routes/*`, `src/controllers/*`,
`src/services/conflictChecker.js`, `src/services/reportService.js`,
`src/middleware/auth.js`, `src/constants/slots.js`

---

## Участник 2 — Frontend (страница пользователя)

### Полный план работы

**Неделя 1–2 — Подготовка**
- [ ] Инициализировать Vite + React + Tailwind CSS
- [ ] Создать `src/api/scheduleApi.js` (axios-клиент с interceptor для JWT)
- [ ] Установить `@tanstack/react-query`, настроить QueryClient
- [ ] Создать макеты страниц в `pages/user/`

**Неделя 3–4 — Компоненты просмотра**
- [ ] `WeekGrid.jsx` — сетка расписания (дни × пары)
- [ ] `LessonCell.jsx` — карточка одного занятия (дисциплина, преподаватель, аудитория)
- [ ] `FilterPanel.jsx` — выпадающие списки: семестр, группа, преподаватель, корпус
- [ ] Интеграция фильтров с API (`useQuery` + `enabled`)

**Неделя 5–6 — Отчёты**
- [ ] `ChessTable.jsx` — шахматная ведомость нескольких групп
- [ ] `ExamSchedulePage.jsx` — зачёты / экзамены / консультации с сортировкой по дате
- [ ] `RoomLoadPage.jsx` — сводная загрузка помещений (группировка по типу, корпусу)
- [ ] Кнопки «Печать» (window.print + CSS @media print)

**Неделя 7 — Финализация**
- [ ] Обработка состояний загрузки (skeleton-заглушки) и ошибок
- [ ] Адаптивная вёрстка для мобильных экранов
- [ ] Написать раздел отчёта о пользовательском интерфейсе

**Файлы-ответственность:**
`src/pages/user/*`, `src/components/schedule/WeekGrid.jsx`,
`src/components/schedule/LessonCell.jsx`, `src/components/schedule/ChessTable.jsx`,
`src/components/filters/FilterPanel.jsx`, `src/components/reports/*`,
`src/api/scheduleApi.js`

---

## Участник 3 — Frontend (страница администратора)

### Полный план работы

**Неделя 1–2 — Подготовка**
- [ ] Реализовать `AdminLayout.jsx` — боковое меню с навигацией по справочникам
- [ ] Авторизация: страница логина, хранение JWT в localStorage, редирект
- [ ] Создать базовый компонент таблицы-справочника (`CrudTable.jsx`) с кнопками добавить / редактировать / удалить

**Неделя 3–4 — Справочники**
- [ ] `DepartmentsPage.jsx` — дерево подразделений (иерархия)
- [ ] `TeachersPage.jsx` — список преподавателей с привязкой к кафедре и дисциплинам
- [ ] `RoomsPage.jsx` — помещения с фильтром по типу и корпусу
- [ ] `GroupsPage.jsx` — академические группы и учебные подгруппы/потоки
- [ ] `CurriculumPage.jsx` — учебные планы (дисциплины, часы, вид отчётности)

**Неделя 5–6 — Редактор расписания**
- [ ] `ScheduleEditorPage.jsx` — сетка с возможностью кликать по ячейке и добавлять занятие
- [ ] `LessonFormModal.jsx` — модальная форма: выбор группы, дисциплины, преподавателя, помещения, типа, слота
- [ ] Отображение ошибок-конфликтов, пришедших от бэкенда
- [ ] Кнопка «Копировать расписание» → запрос к API → переход на копию
- [ ] Таблица занятости преподавателей подразделения (внутри страницы TeachersPage)

**Неделя 7 — Финализация**
- [ ] Клиентская пред-валидация форм (React Hook Form + Zod)
- [ ] Тост-уведомления об успехе / ошибке (react-hot-toast)
- [ ] Написать раздел отчёта о административном интерфейсе

**Файлы-ответственность:**
`src/pages/admin/*`, `src/components/forms/LessonFormModal.jsx`,
`src/components/forms/CrudTable.jsx`, `src/store/authStore.js`

---

## Участник 4 — Аналитик / Тестировщик / Автор отчёта

### Полный план работы

**Неделя 1 — Анализ**
- [ ] Разобрать ТЗ, составить глоссарий (15+ терминов)
- [ ] Написать use cases для обеих ролей (admin, user)
- [ ] Формализовать все 8 ограничений из ТЗ в виде тест-кейсов

**Неделя 2–3 — Тест-план**
- [ ] Разработать тест-план: объём тестирования, виды тестов, инструменты
- [ ] Написать unit-тесты для `conflictChecker.js` (Jest)
- [ ] Написать integration-тесты для API-эндпоинтов (Supertest)

```javascript
// tests/integration/lesson.test.js — пример
describe("POST /api/schedule/:id/lessons", () => {
  it("отклоняет занятие при конфликте времени группы", async () => {
    const res = await request(app)
      .post("/api/schedule/1/lessons")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ studyGroupId: 1, dayOfWeek: 1, slotNumber: 2, /* ... */ });
    expect(res.status).toBe(422);
    expect(res.body.conflicts).toContain("Группа уже занята в это время");
  });
});
```

**Неделя 4–5 — Тестирование фронтенда**
- [ ] E2E-тесты основных сценариев (Playwright)
- [ ] Проверка фильтров на странице пользователя
- [ ] Проверка работы форм на странице администратора
- [ ] Ручное тестирование граничных случаев:
  - 5 пар в день → 6-я должна быть отклонена
  - Количество студентов > вместимость помещения
  - Лаборатория в обычной аудитории
  - Переход между корпусами с недостаточным временем

**Неделя 6–7 — Написание отчёта**
- [ ] Введение: актуальность, цели, задачи
- [ ] Постановка задачи: анализ ТЗ, требования, ограничения
- [ ] Сбор разделов от участников 1, 2, 3
- [ ] Результаты тестирования: таблица дефектов
- [ ] Заключение: выводы, что реализовано, что можно улучшить
- [ ] Единое оформление всего документа

**Файлы-ответственность:**
`tests/unit/*`, `tests/integration/*`, `tests/e2e/*`,
`docs/report/01_intro.md`, `docs/report/02_requirements.md`,
`docs/report/05_testing.md`, `docs/report/06_conclusion.md`,
`docs/report/glossary.md`, `docs/report/use_cases.md`

---

## Структура финального отчёта

```
docs/report/
├── 01_intro.md           # Участник 4: введение, актуальность
├── 02_requirements.md    # Участник 4: постановка задачи, use cases
├── 03_architecture.md    # Участник 1: архитектура, схема БД
├── 04_frontend.md        # Участники 2 + 3: описание интерфейсов
├── 05_testing.md         # Участник 4: тест-план, результаты
├── 06_conclusion.md      # Участник 4: заключение
└── glossary.md           # Участник 4: глоссарий
```

---

## Docker-окружение

```yaml
# docker-compose.yml
version: "3.9"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: schedule_db
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    ports: ["5432:5432"]
    volumes: ["pgdata:/var/lib/postgresql/data"]

  backend:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      DATABASE_URL: postgresql://admin:secret@db:5432/schedule_db
      JWT_SECRET: your_jwt_secret
    depends_on: [db]

  frontend:
    build: ./frontend
    ports: ["5173:5173"]
    environment:
      VITE_API_URL: http://localhost:3000/api

volumes:
  pgdata:
```

---

## Общий таймлайн команды

| Неделя | Участник 1 | Участник 2 | Участник 3 | Участник 4 |
|---|---|---|---|---|
| 1–2 | БД + seed + базовый сервер | Vite + axios + макеты | AdminLayout + CRUD-таблица | Глоссарий + use cases + тест-план |
| 3–4 | API справочников + JWT | WeekGrid + FilterPanel | Справочники (5 страниц) | Unit + Integration тесты |
| 5–6 | API расписания + конфликты | Отчёты + печать | Редактор расписания | E2E тесты + ручное тестирование |
| 7 | Отчёты API + code review | Финализация + раздел отчёта | Финализация + раздел отчёта | Сборка финального отчёта |
