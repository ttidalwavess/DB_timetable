import { NavLink } from "react-router-dom";
import "./Topbar.css";

const LINKS = [
  { to: "/",          label: "Расписание" },
  { to: "/chess",     label: "Шахматка"   },
  { to: "/session",   label: "Сессия"     },
  { to: "/rooms",     label: "Аудитории"  },
  { to: "/teachers",  label: "Преподаватели" },
];

export default function Topbar() {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-logo">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="4" width="18" height="17" rx="2" stroke="#1a73e8" strokeWidth="1.5" fill="white"/>
            <rect x="7" y="2" width="2" height="4" rx="1" fill="#1a73e8"/>
            <rect x="15" y="2" width="2" height="4" rx="1" fill="#1a73e8"/>
            <line x1="3" y1="9" x2="21" y2="9" stroke="#dadce0" strokeWidth="1.5"/>
            <rect x="7" y="13" width="3" height="3" rx="0.5" fill="#4285f4" opacity=".7"/>
            <rect x="11" y="13" width="3" height="3" rx="0.5" fill="#4285f4" opacity=".5"/>
            <rect x="15" y="13" width="3" height="3" rx="0.5" fill="#4285f4" opacity=".3"/>
          </svg>
          <span className="topbar-title">Расписание ДВФУ</span>
        </div>
      </div>

      <nav className="topbar-nav">
        {LINKS.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) => `topbar-link${isActive ? " active" : ""}`}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="topbar-right">
        <span className="topbar-semester">Весенний семестр 2025/26</span>
      </div>
    </header>
  );
}
