import { useState, useEffect } from "react";
import { api } from "../../api";
import { DAYS_OF_WEEK, SLOTS, LESSON_TYPES } from "../../data/mockData";
import LessonForm from "../../components/forms/LessonForm";
import "./ManageSchedulePage.css";

export default function ManageSchedulePage() {
    const [loading, setLoading] = useState(false);
    const [lessons, setLessons] = useState([]);
    const [filters, setFilters] = useState({
        studyGroupId: null,
        teacherId: null,
        roomId: null,
        dayOfWeek: null,
        weekParity: null,
    });

    // Справочники для формы
    const [groups, setGroups] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [assignments, setAssignments] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [buildings, setBuildings] = useState([]);
    const [buildingDistances, setBuildingDistances] = useState([]);

    // Редактирование
    const [editingLesson, setEditingLesson] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    // Сообщения
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);

    // Загрузка справочников
    useEffect(() => {
        Promise.all([
            api.getStudyGroups(),
            api.getTeachers(),
            api.getRooms(),
            api.getSubjects(),
            api.getTeacherAssignments(),
            api.getSchedules(),
            api.getBuildings(),
            api.getBuildingDistances(),
        ]).then(([g, t, r, s, a, sch, b, bd]) => {
            setGroups(g);
            setTeachers(t);
            setRooms(r);
            setSubjects(s);
            setAssignments(a);
            setSchedules(sch);
            setBuildings(b);
            setBuildingDistances(bd);
        });
    }, []);

    // Загрузка занятий
    const loadLessons = async () => {
        setLoading(true);
        try {
            const data = await api.getLessons(filters);
            // Сортируем по дню и паре
            data.sort((a, b) => {
                if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
                return a.slot_id - b.slot_id;
            });
            setLessons(data);
        } catch (err) {
            setError("Ошибка загрузки расписания");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadLessons();
    }, [filters]);

    // Удаление занятия
    const handleDelete = async (lessonId) => {
        try {
            await api.deleteLesson(lessonId);
            setMessage("Занятие удалено");
            setDeleteConfirm(null);
            loadLessons();
            setTimeout(() => setMessage(null), 3000);
        } catch (err) {
            setError("Ошибка удаления занятия");
            setTimeout(() => setError(null), 3000);
        }
    };

    // Редактирование
    const handleEdit = (lesson) => {
        setEditingLesson(lesson);
        setShowForm(true);
    };

    // Сохранение после редактирования
    const handleSave = async (savedLesson) => {
        setMessage("Занятие обновлено");
        setShowForm(false);
        setEditingLesson(null);
        loadLessons();
        setTimeout(() => setMessage(null), 3000);
    };

    // Сброс фильтров
    const resetFilters = () => {
        setFilters({
            studyGroupId: null,
            teacherId: null,
            roomId: null,
            dayOfWeek: null,
            weekParity: null,
        });
    };

    // Получение контекста для формы
    const context = {
        rooms,
        studyGroups: groups,
        teacherAssignments: assignments,
        buildingDistances,
        lessons,
        slots: SLOTS,
        teachers,
        buildings,
        subjects,
        curriculumSubjects: [],
    };

    // Группировка занятий по дням
    const groupedLessons = {};
    DAYS_OF_WEEK.forEach(day => {
        groupedLessons[day.id] = lessons.filter(l => l.day_of_week === day.id);
    });

    return (
        <div className="msp-page">
            {/* Заголовок */}
            <div className="msp-header">
                <h1 className="msp-title">Управление расписанием</h1>
                <button
                    className="btn-primary"
                    onClick={() => {
                        setEditingLesson(null);
                        setShowForm(true);
                    }}
                >
                    + Добавить занятие
                </button>
            </div>

            {/* Сообщения */}
            {message && <div className="msp-success">{message}</div>}
            {error && <div className="msp-error">{error}</div>}

            {/* Фильтры */}
            <div className="msp-filters">
                <select
                    value={filters.studyGroupId || ""}
                    onChange={e => setFilters(f => ({ ...f, studyGroupId: e.target.value ? Number(e.target.value) : null }))}
                >
                    <option value="">Все группы</option>
                    {groups.map(g => (
                        <option key={g.study_group_id} value={g.study_group_id}>
                            {g.study_group_name}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.teacherId || ""}
                    onChange={e => setFilters(f => ({ ...f, teacherId: e.target.value ? Number(e.target.value) : null }))}
                >
                    <option value="">Все преподаватели</option>
                    {teachers.map(t => (
                        <option key={t.teacher_id} value={t.teacher_id}>
                            {t.last_name} {t.first_name[0]}.
                        </option>
                    ))}
                </select>

                <select
                    value={filters.roomId || ""}
                    onChange={e => setFilters(f => ({ ...f, roomId: e.target.value ? Number(e.target.value) : null }))}
                >
                    <option value="">Все аудитории</option>
                    {rooms.map(r => (
                        <option key={r.room_id} value={r.room_id}>
                            {r.room_number}
                        </option>
                    ))}
                </select>

                <select
                    value={filters.dayOfWeek || ""}
                    onChange={e => setFilters(f => ({ ...f, dayOfWeek: e.target.value ? Number(e.target.value) : null }))}
                >
                    <option value="">Все дни</option>
                    {DAYS_OF_WEEK.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                </select>

                <select
                    value={filters.weekParity || ""}
                    onChange={e => setFilters(f => ({ ...f, weekParity: e.target.value || null }))}
                >
                    <option value="">Все недели</option>
                    <option value="ODD">Нечётная</option>
                    <option value="EVEN">Чётная</option>
                </select>

                <button className="btn-ghost" onClick={resetFilters}>
                    ✕ Сбросить
                </button>
            </div>

            {/* Количество записей */}
            <div className="msp-count">
                Найдено занятий: {lessons.length}
            </div>

            {/* Таблица расписания */}
            {loading ? (
                <div className="msp-loading">
                    <div className="sp-spinner" />
                    <span>Загрузка расписания…</span>
                </div>
            ) : (
                <div className="msp-grid-wrap">
                    <table className="msp-grid">
                        <thead>
                        <tr>
                            <th className="msp-th-slot">Пара</th>
                            {DAYS_OF_WEEK.map(d => (
                                <th key={d.id} className="msp-th-day">{d.name}</th>
                            ))}
                        </tr>
                        </thead>
                        <tbody>
                        {SLOTS.map(slot => (
                            <tr key={slot.slot_id}>
                                <td className="msp-td-slot">
                                    <span className="msp-slot-num">{slot.slot_number}</span>
                                    <span className="msp-slot-time">
                      {slot.time_start}–{slot.time_end}
                    </span>
                                </td>
                                {DAYS_OF_WEEK.map(day => {
                                    const cellLessons = lessons.filter(
                                        l => l.slot_id === slot.slot_id && l.day_of_week === day.id
                                    );
                                    return (
                                        <td key={day.id} className="msp-td-cell">
                                            {cellLessons.map(l => (
                                                <div
                                                    key={l.lesson_id}
                                                    className="msp-lesson"
                                                    style={{
                                                        borderLeft: `3px solid ${LESSON_TYPES[l.lesson_type]?.color || '#888'}`
                                                    }}
                                                >
                                                    <div className="msp-lesson-header">
                              <span className="msp-lesson-type">
                                {LESSON_TYPES[l.lesson_type]?.label || l.lesson_type}
                              </span>
                                                        {l.week_parity !== "BOTH" && (
                                                            <span className="msp-lesson-week">
                                  {l.week_parity === "ODD" ? "нечёт" : "чёт"}
                                </span>
                                                        )}
                                                    </div>
                                                    <div className="msp-lesson-subject">{l.subjectName}</div>
                                                    <div className="msp-lesson-meta">
                                                        <span>{l.groupName}</span>
                                                        <span>{l.teacherShort}</span>
                                                        <span>{l.room?.room_number}</span>
                                                    </div>
                                                    <div className="msp-lesson-actions">
                                                        <button
                                                            className="msp-btn-edit"
                                                            onClick={() => handleEdit(l)}
                                                            title="Редактировать"
                                                        >
                                                            ✎
                                                        </button>
                                                        <button
                                                            className="msp-btn-delete"
                                                            onClick={() => setDeleteConfirm(l.lesson_id)}
                                                            title="Удалить"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Подтверждение удаления */}
            {deleteConfirm && (
                <div className="msp-modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="msp-modal" onClick={e => e.stopPropagation()}>
                        <h3 className="msp-modal-title">Подтверждение удаления</h3>
                        <p className="msp-modal-text">
                            Вы уверены, что хотите удалить это занятие? Это действие нельзя отменить.
                        </p>
                        <div className="msp-modal-actions">
                            <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>
                                Отмена
                            </button>
                            <button
                                className="msp-btn-danger"
                                onClick={() => handleDelete(deleteConfirm)}
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Форма добавления/редактирования */}
            {showForm && (
                <div className="msp-modal-overlay" onClick={() => setShowForm(false)}>
                    <div className="msp-modal msp-modal-form" onClick={e => e.stopPropagation()}>
                        <div className="msp-modal-header">
                            <h3 className="msp-modal-title">
                                {editingLesson ? "Редактирование занятия" : "Новое занятие"}
                            </h3>
                            <button
                                className="msp-modal-close"
                                onClick={() => setShowForm(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <LessonForm
                            initialLesson={editingLesson}
                            scheduleId={schedules[0]?.schedule_id}
                            context={context}
                            onSaved={handleSave}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}