import { useState, useEffect } from "react";
import { api } from "../api";
import { DAYS_OF_WEEK, SLOTS, LESSON_TYPES } from "../data/mockData";
import CalendarEvent from "../components/calendar/CalendarEvent";
import "./ChessPage.css";

const GROUP_COLORS = ["#4285F4","#0F9D58","#F4B400","#DB4437","#673AB7","#E65100","#00ACC1"];

export default function ChessPage() {
  const [groups,   setGroups]   = useState([]);
  const [selected, setSelected] = useState([]);
  const [lessons,  setLessons]  = useState([]);
  const [loading,  setLoading]  = useState(false);

  useEffect(() => {
    api.getStudyGroups().then(g => {
      setGroups(g);
      // по умолчанию выбираем первые 2 группы типа FULL
      const defaults = g.filter(x => x.group_type === "FULL").slice(0, 2).map(x => x.study_group_id);
      setSelected(defaults);
    });
  }, []);

  useEffect(() => {
    if (!selected.length) { setLessons([]); return; }
    setLoading(true);
    Promise.all(selected.map(id => api.getLessons({ studyGroupId: id }))).then(res => {
      setLessons(res.flat());
      setLoading(false);
    });
  }, [selected]);

  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const colorOf = (id) => GROUP_COLORS[groups.findIndex(g => g.study_group_id === id) % GROUP_COLORS.length];

  return (
    <div className="chess-layout">
      {/* ── Sidebar ── */}
      <aside className="chess-sidebar">
        <p className="chess-sidebar-title">Группы</p>
        <div className="chess-group-list">
          {groups.map(g => {
            const active = selected.includes(g.study_group_id);
            const color  = colorOf(g.study_group_id);
            return (
              <button
                key={g.study_group_id}
                className={`chess-group-btn${active ? " active" : ""}`}
                style={active ? { color, borderColor: color, background: color + "12" } : {}}
                onClick={() => toggle(g.study_group_id)}
              >
                <span className="chess-group-dot" style={{ background: active ? color : "#dadce0" }} />
                <span className="chess-group-name">{g.study_group_name}</span>
                <span className="chess-group-type">{g.group_type}</span>
              </button>
            );
          })}
        </div>

        <p className="chess-sidebar-title" style={{ marginTop: 20 }}>Типы занятий</p>
        {Object.entries(LESSON_TYPES).map(([k, v]) => (
          <div key={k} className="chess-legend-item">
            <span className="chess-legend-dot" style={{ background: v.color }} />
            <span>{v.label}</span>
          </div>
        ))}
      </aside>

      {/* ── Main ── */}
      <div className="chess-main">
        <div className="chess-main-header">
          <span className="chess-main-title">Шахматная ведомость</span>
          <div className="chess-active-tags">
            {selected.map(id => {
              const g = groups.find(x => x.study_group_id === id);
              return g ? (
                <span key={id} className="chess-tag" style={{ borderColor: colorOf(id), color: colorOf(id) }}>
                  {g.study_group_name}
                </span>
              ) : null;
            })}
          </div>
        </div>

        {loading ? (
          <div className="chess-state"><div className="sp-spinner"/></div>
        ) : selected.length === 0 ? (
          <div className="chess-state">Выберите группы слева</div>
        ) : (
          <div className="chess-scroll">
            <table className="chess-table">
              <thead>
                <tr>
                  <th className="chess-th-slot" />
                  {DAYS_OF_WEEK.map(d => <th key={d.id} className="chess-th-day">{d.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {SLOTS.map(slot => (
                  <tr key={slot.slot_id}>
                    <td className="chess-td-slot">
                      <span className="wg-slot-num">{slot.slot_number}</span>
                      <span className="wg-slot-time">{slot.time_start}<br/>{slot.time_end}</span>
                    </td>
                    {DAYS_OF_WEEK.map(day => {
                      const cell = lessons.filter(l => l.slot_id === slot.slot_id && l.day_of_week === day.id);
                      return (
                        <td key={day.id} className="chess-td-cell">
                          {cell.map(l => {
                            const color = colorOf(l.study_group_id);
                            return (
                              <div
                                key={l.lesson_id}
                                className="chess-event"
                                style={{ borderLeft: `3px solid ${color}`, background: color + "12" }}
                                title={`${l.groupName} | ${l.subjectName} | ${l.teacherShort}`}
                              >
                                <div className="chess-event-group" style={{ color }}>{l.groupName}</div>
                                <div className="chess-event-subj">{l.subjectName}</div>
                                <div className="chess-event-room text-muted text-xs">{l.room?.room_number}</div>
                                {l.week_parity !== "BOTH" && (
                                  <div className="chess-event-week">{l.week_parity === "ODD" ? "нечёт." : "чёт."}</div>
                                )}
                              </div>
                            );
                          })}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
