// src/components/forms/LessonForm.jsx
import { useState } from "react";
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

const RECURRING_TYPES = ["LEC", "PRAC", "LAB"];
const DAY_LABELS = { 1: "Понедельник", 2: "Вторник", 3: "Среда", 4: "Четверг", 5: "Пятница", 6: "Суббота" };

export default function LessonForm({
                                       initialLesson,
                                       scheduleId,
                                       context,
                                       onSaved,
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

    const set = (field, value) => {
        setLesson(prev => {
            const next = { ...prev, [field]: value };

            // При смене типа занятия
            if (field === "lesson_type") {
                if (RECURRING_TYPES.includes(value)) {
                    next.is_recurring = true;
                    next.specific_date = "";
                } else {
                    next.is_recurring = false;
                    next.day_of_week = "";
                    next.week_parity = "BOTH";
                }
            }

            // При смене дисциплины сбрасываем преподавателя
            if (field === "subj_id") {
                next.assignment_id = "";
            }

            return next;
        });
    };

    // Фильтруем преподавателей по выбранной дисциплине
    const filteredAssignments = lesson.subj_id
        ? context.teacherAssignments.filter(a => a.subj_id === Number(lesson.subj_id))
        : context.teacherAssignments;

    // Получаем название дисциплины
    const getSubjectName = (subjectId) => {
        const subject = context.subjects?.find(s => s.subject_id === Number(subjectId));
        return subject?.subject_name || "";
    };

    // Получаем имя преподавателя
    const getTeacherName = (teacherId) => {
        const teacher = context.teachers?.find(t => t.teacher_id === teacherId);
        if (!teacher) return "—";
        return `${teacher.last_name} ${teacher.first_name[0]}.${teacher.middle_name ? teacher.middle_name[0] + "." : ""}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setSubmitError(null);

        // Валидация
        if (!lesson.subj_id) {
            setSubmitError("Выберите дисциплину");
            setSubmitting(false);
            return;
        }
        if (!lesson.study_group_id) {
            setSubmitError("Выберите группу");
            setSubmitting(false);
            return;
        }
        if (!lesson.assignment_id) {
            setSubmitError("Выберите преподавателя");
            setSubmitting(false);
            return;
        }
        if (!lesson.room_id) {
            setSubmitError("Выберите аудиторию");
            setSubmitting(false);
            return;
        }
        if (!lesson.slot_id) {
            setSubmitError("Выберите пару");
            setSubmitting(false);
            return;
        }
        if (lesson.is_recurring && !lesson.day_of_week) {
            setSubmitError("Выберите день недели");
            setSubmitting(false);
            return;
        }
        if (!lesson.is_recurring && !lesson.specific_date) {
            setSubmitError("Укажите дату");
            setSubmitting(false);
            return;
        }

        try {
            const payload = {
                ...lesson,
                schedule_id: Number(lesson.schedule_id),
                study_group_id: Number(lesson.study_group_id),
                assignment_id: Number(lesson.assignment_id),
                subj_id: Number(lesson.subj_id),
                room_id: Number(lesson.room_id),
                slot_id: Number(lesson.slot_id),
                day_of_week: lesson.is_recurring ? Number(lesson.day_of_week) : null,
            };

            const saved = lesson.lesson_id
                ? await api.updateLesson(lesson.lesson_id, payload)
                : await api.createLesson(payload);
            onSaved?.(saved);
        } catch (err) {
            if (err.conflicts) {
                setSubmitError(`Конфликты: ${err.conflicts.map(c => c.text).join("; ")}`);
            } else {
                setSubmitError(err.message || "Ошибка сохранения");
            }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form className="lf-form" onSubmit={handleSubmit}>
            {/* Тип занятия */}
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

            {/* Дисциплина */}
            <div className="lf-field">
                <label className="lf-label">Дисциплина</label>
                <select
                    className="lf-input"
                    value={lesson.subj_id}
                    onChange={e => set("subj_id", e.target.value)}
                >
                    <option value="">Выберите дисциплину</option>
                    {context.subjects?.map(s => (
                        <option key={s.subject_id} value={s.subject_id}>
                            {s.subject_name}
                        </option>
                    ))}
                </select>
            </div>

            {/* Учебная группа */}
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
                            {g.study_group_name} ({g.student_count} чел.)
                        </option>
                    ))}
                </select>
            </div>

            {/* Преподаватель - фильтруется по дисциплине */}
            <div className="lf-field">
                <label className="lf-label">Преподаватель</label>
                <select
                    className="lf-input"
                    value={lesson.assignment_id}
                    onChange={e => set("assignment_id", Number(e.target.value) || "")}
                >
                    <option value="">Выберите преподавателя</option>
                    {filteredAssignments.map(a => {
                        const teacherName = getTeacherName(a.teacher_id);
                        const subjectName = getSubjectName(a.subj_id);
                        return (
                            <option key={a.assignment_id} value={a.assignment_id}>
                                {teacherName}
                                {subjectName && ` — ${subjectName}`}
                                {a.lesson_types && ` (${a.lesson_types})`}
                            </option>
                        );
                    })}
                </select>
                {lesson.subj_id && filteredAssignments.length === 0 && (
                    <div className="lf-hint lf-hint-warning">
                        ⚠ Для выбранной дисциплины нет назначенных преподавателей
                    </div>
                )}
                {!lesson.subj_id && (
                    <div className="lf-hint lf-hint-info">
                        Сначала выберите дисциплину, чтобы увидеть доступных преподавателей
                    </div>
                )}
            </div>

            {/* Аудитория */}
            <div className="lf-field">
                <label className="lf-label">Аудитория</label>
                <select
                    className="lf-input"
                    value={lesson.room_id}
                    onChange={e => set("room_id", Number(e.target.value) || "")}
                >
                    <option value="">Выберите аудиторию</option>
                    {context.rooms.map(r => {
                        const building = context.buildings?.find(b => b.building_id === r.building_id);
                        return (
                            <option key={r.room_id} value={r.room_id}>
                                {r.room_number} {building ? `(корп. ${building.building_name})` : ""}
                                {r.is_online ? " (онлайн)" : ` (${r.capacity} мест)`}
                            </option>
                        );
                    })}
                </select>
            </div>

            {/* Время */}
            {lesson.is_recurring ? (
                <div className="lf-row">
                    <div className="lf-field">
                        <label className="lf-label">День недели</label>
                        <select
                            className="lf-input"
                            value={lesson.day_of_week}
                            onChange={e => set("day_of_week", Number(e.target.value) || "")}
                        >
                            <option value="">Выберите день</option>
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
                            <option value="">Выберите пару</option>
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
                            <option value="">Выберите пару</option>
                            {context.slots?.map(s => (
                                <option key={s.slot_id} value={s.slot_id}>
                                    {s.slot_number}. {s.time_start}–{s.time_end}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {submitError && (
                <div className="lf-submit-error">{submitError}</div>
            )}

            <div className="lf-actions">
                <button type="button" className="btn-ghost" onClick={onCancel}>
                    Отмена
                </button>
                <button
                    type="submit"
                    className="btn-primary"
                    disabled={submitting}
                >
                    {submitting ? "Сохранение…" : lesson.lesson_id ? "Сохранить" : "Добавить"}
                </button>
            </div>
        </form>
    );
}