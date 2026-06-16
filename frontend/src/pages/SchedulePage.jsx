import { useState, useEffect } from "react";
import FiltersBar from "../components/filters/FiltersBar";
import WeekGrid   from "../components/calendar/WeekGrid";
import ListView   from "../components/calendar/ListView";
import { api } from "../api";
import "./SchedulePage.css";

export default function SchedulePage() {
  const [groups,   setGroups]   = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [rooms,    setRooms]    = useState([]);
  const [lessons,  setLessons]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [view,     setView]     = useState("week"); // "week" | "list"

  const [filters, setFilters] = useState({
    studyGroupId: null, teacherId: null, roomId: null,
    dayOfWeek: null, weekParity: null,
  });

  useEffect(() => {
    Promise.all([api.getStudyGroups(), api.getTeachers(), api.getRooms()])
      .then(([g, t, r]) => { setGroups(g); setTeachers(t); setRooms(r); });
  }, []);

  useEffect(() => {
    setLoading(true);
    api.getLessons(filters).then(data => {
      setLessons(data);
      setLoading(false);
    });
  }, [filters]);

  return (
    <div className="sp-page">
      <FiltersBar
        groups={groups} teachers={teachers} rooms={rooms}
        filters={filters} onChange={setFilters}
      />

      <div className="sp-toolbar">
        <span className="sp-count">
          {loading ? "Загрузка…" : `${lessons.length} занятий`}
        </span>
        <div className="sp-view-toggle">
          <button
            className={`btn-ghost${view === "week" ? " active" : ""}`}
            onClick={() => setView("week")}
          >
            ⊞ Неделя
          </button>
          <button
            className={`btn-ghost${view === "list" ? " active" : ""}`}
            onClick={() => setView("list")}
          >
            ☰ Список
          </button>
        </div>
      </div>

      <div className="sp-body">
        {loading ? (
          <div className="sp-state">
            <div className="sp-spinner" />
            <span>Загрузка расписания…</span>
          </div>
        ) : lessons.length === 0 ? (
          <div className="sp-state">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#dadce0" strokeWidth="1.2">
              <rect x="3" y="4" width="18" height="17" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="16" y1="2" x2="16" y2="6"/>
            </svg>
            <p className="sp-empty-title">Занятий не найдено</p>
            <p className="text-muted text-sm">Попробуйте изменить фильтры</p>
          </div>
        ) : view === "week" ? (
          <WeekGrid lessons={lessons} filterDayId={filters.dayOfWeek} />
        ) : (
          <ListView lessons={lessons} />
        )}
      </div>
    </div>
  );
}
