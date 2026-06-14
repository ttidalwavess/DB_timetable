Если в `ReferencesPage.jsx` нужны школы/кафедры/академ. группы — добавить в `api/index.js`:
```js
getSchools:        async () => { await delay(); return SCHOOLS; },
getDepartments:    async () => { await delay(); return DEPARTMENTS; },
getAcademicGroups: async () => { await delay(); return ACADEMIC_GROUPS; },
```
(массивы `SCHOOLS`, `DEPARTMENTS`, `ACADEMIC_GROUPS` — в `mockData.js`, по аналогии с `TEACHERS`/`ROOMS`).
Если этих данных пока нет — `ReferencesPage` покажет `EmptyState` без ошибок (есть `?.()` фоллбэки).

4. Использование `LessonForm`

```jsx
import LessonForm from "../components/forms/LessonForm";

<LessonForm
  initialLesson={editingLesson}      // null = создание нового
  scheduleId={currentScheduleId}
  context={{
    rooms, studyGroups, teachers, teacherAssignments,
    buildingDistances, lessons, slots, buildings, curriculumSubjects,
  }}
  onSaved={(lesson) => { /* обновить список, закрыть модалку */ }}
  onCancel={() => setModalOpen(false)}
/>
```

Все справочники для `context` уже есть в `api/index.js`:
```js
const [rooms, studyGroups, teachers, teacherAssignments, buildingDistances, slots, buildings] =
  await Promise.all([
    api.getRooms(), api.getStudyGroups(), api.getTeachers(),
    api.getTeacherAssignments(), api.getBuildingDistances(),
    api.getSlots(), api.getBuildings(),
  ]);
const lessons = await api.getLessons({ scheduleId: currentScheduleId });
```

---

5. Копирование расписания

```jsx
import CopyScheduleDialog from "../components/forms/CopyScheduleDialog";

<CopyScheduleDialog
  sourceSchedule={currentSchedule}
  onCopied={({ schedule, copiedLessonsCount }) => {
    alert(`Скопировано занятий: ${copiedLessonsCount}`);
    // навигация на новое расписание: schedule.schedule_id
  }}
  onCancel={() => setDialogOpen(false)}
/>
```

Валидация: пустое название, дубликат названия (проверяется по `SCHEDULES`), год ≥ 2000, семестр 1–12.

---

6. Маршрут `/admin/references`

В `App.jsx`:
```jsx
import ReferencesPage from "./pages/admin/ReferencesPage";
// ...
<Route path="/admin/references" element={<ReferencesPage />} />
```

Занятость преподавателей (`/teachers`) — уже реализована в твоём `TeachersPage.jsx`
(подсветка `day-over` при > 5 пар/день), отдельной страницы делать не нужно.
