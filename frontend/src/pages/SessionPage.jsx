import { useState, useEffect } from "react";
import { api } from "../api";
import { LESSON_TYPES } from "../data/mockData";
import "./SessionPage.css";

const SESSION_TYPE_ORDER = ["CONSUL", "CREDIT", "EXAM"];

export default function SessionPage() {
  const [groups,  setGroups]  = useState([]);
  const [teachers,setTeachers]= useState([]);
  const [events,  setEvents]  = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ studyGroupId: null, teacherId: null, lessonType: null });

  useEffect(() => {
    Promise.all([api.getStudyGroups(), api.getTeachers()]).then(([g, t]) => {
      setGroups(g); setTeachers(t);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getSessionLessons(filters).then(data => {
      setEvents(data.sort((a, b) => (a.specific_date || "").localeCompare(b.specific_date || "")));
      setLoading(false);
    });
  }, [filters]);

  // группируем по дате
  const byDate = events.reduce((acc, e) => {
    const d = e.specific_date || "?";
    acc[d] = acc[d] || [];
    acc[d].push(e);
    return acc;
  }, {});

  const formatDate = (d) => {
    if (!d || d === "?") return "Без даты";
    const dt = new Date(d);
    return dt.toLocaleDateString("ru-RU", { weekday: "long", day: "numeric", month: "long" });
  };

  const counts = SESSION_TYPE_ORDER.reduce((a, t) => {
    a[t] = events.filter(e => e.lesson_type === t).length;
    return a;
  }, {});

  return (
    <div className="sess-page">
      {/* Filters */}
      <div className="sess-filters">
        <select value={filters.studyGroupId || ""} onChange={e => setFilters(f => ({ ...f, studyGroupId: e.target.value ? Number(e.target.value) : null }))}>
          <option value="">Все группы</option>
          {groups.map(g => <option key={g.study_group_id} value={g.study_group_id}>{g.study_group_name}</option>)}
        </select>
        <select value={filters.teacherId || ""} onChange={e => setFilters(f => ({ ...f, teacherId: e.target.value ? Number(e.target.value) : null }))}>
          <option value="">Все преподаватели</option>
          {teachers.map(t => <option key={t.teacher_id} value={t.teacher_id}>{t.last_name} {t.first_name[0]}.</option>)}
        </select>
        <div className="sess-type-toggle">
          {SESSION_TYPE_ORDER.map(type => {
            const info = LESSON_TYPES[type];
            const active = filters.lessonType === type;
            return (
              <button
                key={type}
                className={`sess-type-btn${active ? " active" : ""}`}
                style={active ? { borderColor: info.color, color: info.color, background: info.bg } : {}}
                onClick={() => setFilters(f => ({ ...f, lessonType: active ? null : type }))}
              >
                {info.label}
              </button>
            );
          })}
        </div>
        {(filters.studyGroupId || filters.teacherId || filters.lessonType) && (
          <button className="filters-reset" onClick={() => setFilters({ studyGroupId: null, teacherId: null, lessonType: null })}>
            ✕ Сбросить
          </button>
        )}
      </div>

      {/* Summary counts */}
      <div className="sess-stats">
        {SESSION_TYPE_ORDER.map(type => {
          const info = LESSON_TYPES[type];
          return (
            <div key={type} className="sess-stat" style={{ borderTop: `3px solid ${info.color}` }}>
              <div className="sess-stat-num">{counts[type]}</div>
              <div className="sess-stat-label">{info.label}</div>
            </div>
          );
        })}
      </div>

      {/* Events */}
      <div className="sess-body">
        {loading ? (
          <div className="sess-state"><div className="sp-spinner" /></div>
        ) : Object.keys(byDate).length === 0 ? (
          <div className="sess-state">
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.2">
              <rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
            </svg>
            <p>Мероприятий не найдено</p>
          </div>
        ) : (
          Object.keys(byDate).sort().map(date => (
            <div key={date} className="sess-date-group">
              <div className="sess-date-label">{formatDate(date)}</div>
              <div className="sess-events">
                {byDate[date].map(e => {
                  const info = LESSON_TYPES[e.lesson_type] || {};
                  return (
                    <div key={e.lesson_id} className="sess-event" style={{ borderLeft: `4px solid ${info.color}` }}>
                      <div className="sess-event-left">
                        <span className={`badge badge-${e.lesson_type}`}>{info.label}</span>
                        <div className="sess-event-time">
                          {e.slot ? `${e.slot.time_start} – ${e.slot.time_end}` : ""}
                        </div>
                      </div>
                      <div className="sess-event-body">
                        <div className="sess-event-subject">{e.subjectName}</div>
                        <div className="sess-event-meta">
                          <span>👥 {e.groupName}</span>
                          <span>👤 {e.teacherShort}</span>
                          <span>🏛 {e.roomLabel}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
