import { useState, useRef, useEffect } from "react";
import { api } from "../../api";
import "./ConflictBadge.css";

export default function ConflictBadge({ lesson }) {
  const [conflicts, setConflicts] = useState([]);
  const [open, setOpen]           = useState(false);
  const [pos, setPos]             = useState({ top: 0, left: 0 });
  const btnRef                    = useRef(null);

  useEffect(() => {
    api.checkConflicts(lesson).then(setConflicts);
  }, [lesson.lesson_id]);

  // Закрывать при клике вне
  useEffect(() => {
    if (!open) return;
    const close = (e) => {
      if (btnRef.current && !btnRef.current.closest(".conflict-wrap").contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (!conflicts.length) return null;

  const toggle = (e) => {
    e.stopPropagation();
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPos({
        top:  rect.bottom + window.scrollY + 4,
        left: rect.left   + window.scrollX,
      });
    }
    setOpen(o => !o);
  };

  return (
    <div className="conflict-wrap">
      <button ref={btnRef} className="conflict-btn" onClick={toggle} title="Конфликт">
        ⚠ {conflicts.length}
      </button>

      {open && (
        <div
          className="conflict-popup"
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
        >
          <div className="conflict-popup-title">⚠ Конфликты</div>
          {conflicts.map((c, i) => (
            <div key={i} className="conflict-item">
              <span className="conflict-code">{c.code.replace(/_/g, " ")}</span>
              <span className="conflict-text">{c.text}</span>
            </div>
          ))}
          <button className="conflict-close" onClick={() => setOpen(false)}>Закрыть</button>
        </div>
      )}
    </div>
  );
}
