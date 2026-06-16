import "./FiltersBar.css";
import { DAYS_OF_WEEK } from "../../data/mockData";

export default function FiltersBar({ groups, teachers, rooms, filters, onChange }) {
  const set = (key) => (e) => {
    const val = e.target.value ? Number(e.target.value) : null;
    onChange({ ...filters, [key]: val });
  };
  const setStr = (key) => (e) => onChange({ ...filters, [key]: e.target.value || null });

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div className="filters-bar">
      <div className="filters-selects">
        <select value={filters.studyGroupId || ""} onChange={set("studyGroupId")}>
          <option value="">Все группы</option>
          {groups.map(g => (
            <option key={g.study_group_id} value={g.study_group_id}>{g.study_group_name}</option>
          ))}
        </select>

        <select value={filters.teacherId || ""} onChange={set("teacherId")}>
          <option value="">Все преподаватели</option>
          {teachers.map(t => (
            <option key={t.teacher_id} value={t.teacher_id}>
              {t.last_name} {t.first_name[0]}.{t.middle_name ? t.middle_name[0] + "." : ""}
            </option>
          ))}
        </select>

        <select value={filters.roomId || ""} onChange={set("roomId")}>
          <option value="">Все аудитории</option>
          {rooms.map(r => (
            <option key={r.room_id} value={r.room_id}>{r.room_number}</option>
          ))}
        </select>

        <select value={filters.dayOfWeek || ""} onChange={set("dayOfWeek")}>
          <option value="">Все дни</option>
          {DAYS_OF_WEEK.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        <div className="week-toggle">
          {[
            { val: null,   label: "Все" },
            { val: "ODD",  label: "Нечётная" },
            { val: "EVEN", label: "Чётная" },
          ].map(({ val, label }) => (
            <button
              key={String(val)}
              className={`week-btn${filters.weekParity === val ? " active" : ""}`}
              onClick={() => onChange({ ...filters, weekParity: val })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {hasFilters && (
        <button
          className="filters-reset"
          onClick={() => onChange({ studyGroupId: null, teacherId: null, roomId: null, dayOfWeek: null, weekParity: null })}
        >
          ✕ Сбросить
        </button>
      )}
    </div>
  );
}
