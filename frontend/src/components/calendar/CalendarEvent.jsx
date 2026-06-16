import ConflictBadge from "./ConflictBadge";
import "./CalendarEvent.css";

export default function CalendarEvent({ lesson, compact = false, onClick }) {
  const { typeInfo, subjectName, teacherShort, roomLabel, groupName, slot, week_parity } = lesson;

  return (
    <div
      className={`cal-event ${compact ? "compact" : ""}`}
      style={{ background: typeInfo.bg, borderLeft: `3px solid ${typeInfo.color}` }}
      onClick={onClick}
      title={`${subjectName}\n${teacherShort}\n${roomLabel}\n${groupName}`}
    >
      <div className="cal-event-header">
        <div className="cal-event-title" style={{ color: typeInfo.color }}>
          {subjectName}
        </div>
        <ConflictBadge lesson={lesson} />
      </div>
      {!compact && (
        <>
          <div className="cal-event-meta">
            {slot && <span>{slot.time_start}–{slot.time_end}</span>}
            {week_parity !== "BOTH" && (
              <span className="cal-event-week">
                {week_parity === "ODD" ? "нечёт." : "чёт."}
              </span>
            )}
          </div>
          <div className="cal-event-sub">{teacherShort}</div>
          <div className="cal-event-sub">{roomLabel}</div>
          {groupName && <div className="cal-event-sub">{groupName}</div>}
        </>
      )}
      {compact && (
        <div className="cal-event-compact-sub">
          {teacherShort} · {lesson.room?.room_number}
        </div>
      )}
    </div>
  );
}
