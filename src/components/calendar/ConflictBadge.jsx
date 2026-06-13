import { useState, useEffect } from "react";
import { api } from "../../api";
import "./ConflictBadge.css";

export default function ConflictBadge({ lesson }) {
  const [conflicts, setConflicts] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.checkConflicts(lesson).then(setConflicts);
  }, [lesson.lesson_id]);

  if (!conflicts.length) return null;

  return (
    <div className="conflict-wrap">
      <button
        className="conflict-btn"
        onClick={e => { e.stopPropagation(); setOpen(o => !o); }}
        title="Конфликт расписания"
      >
        ⚠ {conflicts.length}
      </button>
      {open && (
        <div className="conflict-popup">
          <div className="conflict-popup-title">Конфликты</div>
          {conflicts.map((c, i) => (
            <div key={i} className="conflict-item">
              <span className="conflict-code">{c.code}</span>
              <span className="conflict-text">{c.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
