import { useState, useEffect } from "react";
import { api } from "../api";
import { DAYS_OF_WEEK, SLOTS, LESSON_TYPES } from "../data/mockData";
import "./TeachersPage.css";

export default function TeachersPage() {
  const [summary,  setSummary]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState(null); // teacher_id
  const [deptFilter, setDept]   = useState("");

  useEffect(() => {
    setLoading(true);
    api.getTeacherLoadSummary().then(data => {
      setSummary(data);
      setLoading(false);
      if (data.length) setSelected(data[0].teacher.teacher_id);
    });
  }, []);

  const depts = [...new Set(summary.map(s => s.teacher.department_id))];
  const filtered = deptFilter
    ? summary.filter(s => String(s.teacher.department_id) === deptFilter)
    : summary;

  const current = summary.find(s => s.teacher.teacher_id === selected);

  return (
    <div className="tp-layout">
      {/* ── Left: teacher list ── */}
      <aside className="tp-sidebar">
        <div className="tp-sidebar-top">
          <p className="tp-sidebar-title">Преподаватели</p>
          <select
            className="tp-dept-filter"
            value={deptFilter}
            onChange={e => setDept(e.target.value)}
          >
            <option value="">Все кафедры</option>
            {depts.map(d => (
              <option key={d} value={d}>Кафедра {d}</option>
            ))}
          </select>
        </div>
        <div className="tp-teacher-list">
          {filtered.map(({ teacher, shortName, total, overLimit }) => (
            <button
              key={teacher.teacher_id}
              className={`tp-teacher-btn${selected === teacher.teacher_id ? " active" : ""}`}
              onClick={() => setSelected(teacher.teacher_id)}
            >
              <div className="tp-teacher-avatar">
                {teacher.last_name[0]}{teacher.first_name[0]}
              </div>
              <div className="tp-teacher-info">
                <div className="tp-teacher-name">{shortName}</div>
                <div className="tp-teacher-pos">{teacher.position}</div>
              </div>
              <div className="tp-teacher-badge-wrap">
                <span className="tp-total-badge">{total}</span>
                {overLimit && <span className="tp-warn-badge" title="Превышен лимит 5 пар/день">!</span>}
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* ── Right: detail ── */}
      <div className="tp-main">
        {loading ? (
          <div className="tp-state"><div className="sp-spinner" /></div>
        ) : !current ? (
          <div className="tp-state">Выберите преподавателя</div>
        ) : (
          <>
            {/* Teacher header */}
            <div className="tp-header">
              <div className="tp-header-avatar">
                {current.teacher.last_name[0]}{current.teacher.first_name[0]}
              </div>
              <div className="tp-header-info">
                <div className="tp-header-name">
                  {current.teacher.last_name} {current.teacher.first_name} {current.teacher.middle_name}
                </div>
                <div className="tp-header-meta">
                  {current.teacher.position}
                  {current.teacher.academic_rank && ` · ${current.teacher.academic_rank}`}
                  {current.teacher.academic_degree && ` · ${current.teacher.academic_degree}`}
                </div>
              </div>
              <div className="tp-header-stats">
                <div className="tp-stat">
                  <div className="tp-stat-num">{current.total}</div>
                  <div className="tp-stat-label">пар в нед.</div>
                </div>
                <div className={`tp-stat ${current.overLimit ? "danger" : ""}`}>
                  <div className="tp-stat-num">{current.maxPerDay}</div>
                  <div className="tp-stat-label">макс/день</div>
                </div>
              </div>
            </div>

            {current.overLimit && (
              <div className="tp-alert">
                ⚠ Превышен лимит 5 пар в один день (максимум: {current.maxPerDay})
              </div>
            )}

            {/* Subject breakdown — как v_teacher_load */}
            <div className="tp-section-title">Нагрузка по дисциплинам</div>
            <div className="tp-subjects-table-wrap">
              <table className="tp-subjects-table">
                <thead>
                  <tr>
                    <th>Дисциплина</th>
                    {Object.entries(LESSON_TYPES).filter(([k]) => ["LEC","PRAC","LAB"].includes(k)).map(([k, v]) => (
                      <th key={k}><span className={`badge badge-${k}`}>{v.label}</span></th>
                    ))}
                    <th>Итого</th>
                  </tr>
                </thead>
                <tbody>
                  {current.bySubject.length === 0 ? (
                    <tr><td colSpan={5} className="tp-empty">Нет занятий</td></tr>
                  ) : current.bySubject.map(s => (
                    <tr key={s.name}>
                      <td className="tp-subj-name">{s.name}</td>
                      <td className="tp-num">{s.LEC || "—"}</td>
                      <td className="tp-num">{s.PRAC || "—"}</td>
                      <td className="tp-num">{s.LAB || "—"}</td>
                      <td className="tp-num bold">{s.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Weekly grid */}
            <div className="tp-section-title">Расписание на неделю</div>
            <div className="tp-grid-wrap">
              <table className="tp-week-grid">
                <thead>
                  <tr>
                    <th className="tp-th-slot" />
                    {DAYS_OF_WEEK.map(d => <th key={d.id} className="tp-th-day">{d.name}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {SLOTS.map(slot => {
                    const rowLessons = current.lessons.filter(l => l.slot_id === slot.slot_id);
                    const overDay = DAYS_OF_WEEK.some(d => {
                      const dayTotal = current.lessons.filter(l => l.day_of_week === d.id).length;
                      return dayTotal > 5;
                    });
                    return (
                      <tr key={slot.slot_id}>
                        <td className="tp-td-slot">
                          <span className="wg-slot-num">{slot.slot_number}</span>
                          <span className="wg-slot-time">{slot.time_start}<br/>{slot.time_end}</span>
                        </td>
                        {DAYS_OF_WEEK.map(day => {
                          const cell = rowLessons.filter(l => l.day_of_week === day.id);
                          const dayCount = current.lessons.filter(l => l.day_of_week === day.id).length;
                          const dayOver = dayCount > 5;
                          return (
                            <td
                              key={day.id}
                              className={`tp-td-cell${dayOver ? " day-over" : ""}`}
                            >
                              {cell.map(l => {
                                const info = LESSON_TYPES[l.lesson_type] || {};
                                return (
                                  <div
                                    key={l.lesson_id}
                                    className="tp-event"
                                    style={{ borderLeft: `3px solid ${info.color}`, background: info.bg }}
                                    title={`${l.subjectName} | ${l.groupName} | ${l.roomLabel}`}
                                  >
                                    <div className="tp-event-type" style={{ color: info.color }}>
                                      <span className={`badge badge-${l.lesson_type}`}>{info.label}</span>
                                      {l.week_parity !== "BOTH" && (
                                        <span className="tp-event-week">
                                          {l.week_parity === "ODD" ? "нечёт." : "чёт."}
                                        </span>
                                      )}
                                    </div>
                                    <div className="tp-event-subj">{l.subjectName}</div>
                                    <div className="tp-event-meta">{l.groupName} · {l.room?.room_number}</div>
                                  </div>
                                );
                              })}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Day load bar */}
            <div className="tp-section-title">Пар в день</div>
            <div className="tp-day-bars">
              {DAYS_OF_WEEK.map(d => {
                const cnt = current.byDay[d.id] || 0;
                const over = cnt > 5;
                return (
                  <div key={d.id} className="tp-day-bar-item">
                    <div className="tp-day-bar-label">{d.short}</div>
                    <div className="tp-day-bar-track">
                      <div
                        className={`tp-day-bar-fill ${over ? "over" : ""}`}
                        style={{ width: `${Math.min(cnt / 5 * 100, 100)}%` }}
                      />
                    </div>
                    <div className={`tp-day-bar-num ${over ? "over" : ""}`}>{cnt}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
