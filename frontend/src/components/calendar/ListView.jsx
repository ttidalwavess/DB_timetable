import CalendarEvent from "./CalendarEvent";
import "./ListView.css";
import { DAYS_OF_WEEK, SLOTS } from "../../data/mockData";

export default function ListView({ lessons }) {
  const grouped = DAYS_OF_WEEK.map(day => ({
    day,
    slots: SLOTS.map(slot => ({
      slot,
      lessons: lessons.filter(l => l.day_of_week === day.id && l.slot_id === slot.slot_id),
    })).filter(s => s.lessons.length > 0),
  })).filter(d => d.slots.length > 0);

  if (!grouped.length) return null;

  return (
    <div className="list-view">
      {grouped.map(({ day, slots }) => (
        <div key={day.id} className="lv-day">
          <div className="lv-day-label">{day.name}</div>
          <div className="lv-slots">
            {slots.map(({ slot, lessons }) => (
              <div key={slot.slot_id} className="lv-row">
                <div className="lv-slot-info">
                  <div className="lv-slot-num">{slot.slot_number}</div>
                  <div className="lv-slot-time">{slot.time_start}<br/>{slot.time_end}</div>
                </div>
                <div className="lv-events">
                  {lessons.map(l => <CalendarEvent key={l.lesson_id} lesson={l} />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
