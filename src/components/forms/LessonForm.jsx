//Форма создания/редактирования занятия с валидацией в реальном времени.
import { useState } from "react";
import { useLessonValidation } from "../../hooks/useLessonValidation";
import { api } from "../../api";
import "./LessonForm.css";

const LESSON_TYPE_OPTIONS = [
  { value: "LEC",    label: "Лекция" },
  { value: "PRAC",   label: "Практика / Семинар" },
  { value: "LAB",    label: "Лабораторная работа" },
  { value: "EXAM",   label: "Экзамен" },
  { value: "CREDIT", label: "Зачёт" },
  { value: "CONSUL", label: "Консультация" },
];

const RECURRING_TYPES = ["LEC", "PRAC", "LAB"];   // еженедельные
const ONESHOT_TYPES   = ["EXAM", "CREDIT", "CONSUL"]; // разовые, с конкретной датой

const DAY_LABELS = { 1: "Понедельник", 2: "Вторник", 3: "Среда", 4: "Четверг", 5: "Пятница", 6: "Суббота" };

export default function LessonForm({
  initialLesson,        
  scheduleId,
  context,              // { rooms, studyGroups, teacherAssignments, buildingDistances, lessons, slots, curriculumSubjects }
  onSaved,              // (lesson) => void
  onCancel,
}) {
  const [lesson, setLesson] = useState(() => initialLesson ?? {
    lesson_id: null,
    schedule_id: scheduleId,
    study_group_id: "",
    assignment_id: "",
    subj_id: "",
    room_id: "",
    lesson_type: "LEC",
    slot_id: "",
    is_recurring: true,
    day_of_week: "",
    week_parity: "BOTH",
    specific_date: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const { fieldHints, localWarnings, conflicts, isChecking, hasBlockingErrors } =
    useLessonValidation(lesson, context, true);

  const set = (field, value) => {
    setLesson(prev => {
      const next = { ...prev, [field]: value };

      // При смене типа занятия — переключаем recurring/one-shot 
      if (field === "lesson_type") {
        if (RECURRING_TYPES.includes(value)) {
          next.is_recurring = true;
          next.specific_date = "";
        } else if (ONESHOT_TYPES.includes(value)) {
          next.is_recurring = false;
          next.day_of_week = "";
          next.week_parity = "BOTH";
        }
      }

      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasBlockingErrors) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const saved = lesson.lesson_id
        ? await api.updateLesson(lesson.lesson_id, lesson)
        : await api.createLesson(lesson);
      onSaved?.(saved);
    } catch (err) {
      if (err.conflicts) {
        // финальная серверная проверка нашла что-то новое (гонка состояний)
        setSubmitError(err.conflicts.map(c => c.text).join("; "));
      } else {
        setSubmitError(err.message || "Ошибка сохранения");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hint = (field) => fieldHints[field];

  const hintClass = (level) => {
    if (level === "error") return "lf-hint lf-hint-error";
    if (level === "warning") return "lf-hint lf-hint-warning";
    return "lf-hint lf-hint-ok";
  };

  return (
    <form className="lf-form" onSubmit={handleSubmit}>
      <div className="lf-field">
        <label className="lf-label">Тип занятия</label>
        <select
          className="lf-input"
          value={lesson.lesson_type}
          onChange={e => set("lesson_type", e.target.value)}
        >
          {LESSON_TYPE_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className="lf-field">
        <label className="lf-label">Учебная группа</label>
        <select
          className="lf-input"
          value={lesson.study_group_id}
          onChange={e => set("study_group_id", Number(e.target.value) || "")}
        >
          <option value="">Выберите группу</option>
          {context.studyGroups.map(g => (
            <option key={g.study_group_id} value={g.study_group_id}>
              {g.study_group_name} ({g.student_count} чел., {g.group_type})
            </option>
          ))}
        </select>
      </div>

      <div className="lf-field">
        <label className="lf-label">Преподаватель</label>
        <select
          className="lf-input"
          value={lesson.assignment_id}
          onChange={e => set("assignment_id", Number(e.target.value) || "")}
        >
          <option value="">Выберите преподавателя</option>
          {context.teacherAssignments
            .filter(a => !lesson.subj_id || a.subj_id === lesson.subj_id)
            .map(a => {
              const teacher = context.teachers?.find(t => t.teacher_id === a.teacher_id);
              return (
                <option key={a.assignment_id} value={a.assignment_id}>
                  {teacher ? `${teacher.last_name} ${teacher.first_name[0]}.` : `#${a.teacher_id}`}
                  {" — "}{a.lesson_types}
                </option>
              );
            })}
        </select>
        {hint("assignment_id") && (
          <div className={hintClass(hint("assignment_id").level)}>
            {hint("assignment_id").message}
          </div>
        )}
      </div>

      <div className="lf-field">
        <label className="lf-label">
          Помещение
          {lesson.lesson_type === "LAB" && (
            <span className="lf-label-note"> (только лаборатория / комп. класс)</span>
          )}
        </label>
        <select
          className="lf-input"
          value={lesson.room_id}
          onChange={e => set("room_id", Number(e.target.value) || "")}
        >
          <option value="">Выберите помещение</option>
          {context.rooms
            .filter(r => lesson.lesson_type !== "LAB" || ["LABORATORY","COMPUTER"].includes(r.room_type))
            .map(r => {
              const building = context.buildings?.find(b => b.building_id === r.building_id);
              return (
                <option key={r.room_id} value={r.room_id}>
                  {r.room_number} — корп. {building?.building_name ?? r.building_id}
                  {r.is_online ? " (онлайн)" : ` (до ${r.capacity} мест)`}
                </option>
              );
            })}
        </select>

        {/*вместимость, тип помещения, время перехода — все привязаны к room_id */}
        {hint("room_id") && (
          <div className={hintClass(hint("room_id").level)}>
            {hint("room_id").message}
          </div>
        )}
      </div>

      {/* ── Время: еженедельно (день + пара + чётность) или разово (дата + пара) ── */}
      {lesson.is_recurring ? (
        <div className="lf-row">
          <div className="lf-field">
            <label className="lf-label">День недели</label>
            <select
              className="lf-input"
              value={lesson.day_of_week}
              onChange={e => set("day_of_week", Number(e.target.value) || "")}
            >
              <option value="">—</option>
              {Object.entries(DAY_LABELS).map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </div>

          <div className="lf-field">
            <label className="lf-label">Пара</label>
            <select
              className="lf-input"
              value={lesson.slot_id}
              onChange={e => set("slot_id", Number(e.target.value) || "")}
            >
              <option value="">—</option>
              {context.slots?.map(s => (
                <option key={s.slot_id} value={s.slot_id}>
                  {s.slot_number}. {s.time_start}–{s.time_end}
                </option>
              ))}
            </select>
          </div>

          <div className="lf-field">
            <label className="lf-label">Недели</label>
            <select
              className="lf-input"
              value={lesson.week_parity}
              onChange={e => set("week_parity", e.target.value)}
            >
              <option value="BOTH">Каждую</option>
              <option value="ODD">Нечётные</option>
              <option value="EVEN">Чётные</option>
            </select>
          </div>
        </div>
      ) : (
        <div className="lf-row">
          <div className="lf-field">
            <label className="lf-label">Дата</label>
            <input
              type="date"
              className="lf-input"
              value={lesson.specific_date}
              onChange={e => set("specific_date", e.target.value)}
            />
          </div>
          <div className="lf-field">
            <label className="lf-label">Пара</label>
            <select
              className="lf-input"
              value={lesson.slot_id}
              onChange={e => set("slot_id", Number(e.target.value) || "")}
            >
              <option value="">—</option>
              {context.slots?.map(s => (
                <option key={s.slot_id} value={s.slot_id}>
                  {s.slot_number}. {s.time_start}–{s.time_end}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Подсказка по лимиту пар/день — привязана к day_of_week */}
      {hint("day_of_week") && (
        <div className={hintClass(hint("day_of_week").level)}>
          {hint("day_of_week").message}
        </div>
      )}

      {/*Список конфликтов (локальные + серверные пересечения)*/}
      {isChecking && (
        <div className="lf-checking">Проверка пересечений…</div>
      )}

      {conflicts.length > 0 && (
        <div className="lf-conflicts">
          <div className="lf-conflicts-title">Обнаружены конфликты:</div>
          <ul className="lf-conflicts-list">
            {conflicts.map((c, i) => (
              <li key={`${c.code}-${i}`}>{c.text}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Некритичные предупреждения*/}
      {conflicts.length === 0 && localWarnings.length > 0 && (
        <div className="lf-warnings">
          {localWarnings.map((w, i) => (
            <div key={i} className="lf-hint lf-hint-warning">{w.message}</div>
          ))}
        </div>
      )}

      {submitError && <div className="lf-submit-error">{submitError}</div>}

      <div className="lf-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>
          Отмена
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting || hasBlockingErrors}
          title={hasBlockingErrors ? "Исправьте конфликты перед сохранением" : undefined}
        >
          {submitting ? "Сохранение…" : lesson.lesson_id ? "Сохранить" : "Добавить"}
        </button>
      </div>
    </form>
  );
}
