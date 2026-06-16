import CalendarEvent from "./CalendarEvent";
import "./WeekGrid.css";
import { DAYS_OF_WEEK, SLOTS } from "../../data/mockData";

export default function WeekGrid({ lessons, filterDayId }) {
  const days = filterDayId ? DAYS_OF_WEEK.filter(d => d.id === filterDayId) : DAYS_OF_WEEK;

  return (
    <div className="week-grid-wrap">
      <table className="week-grid">
        <thead>
          <tr>
            <th className="wg-gutter" />
            {days.map(d => (
              <th key={d.id} className="wg-day-header">{d.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {SLOTS.map(slot => (
            <tr key={slot.slot_id} className="wg-row">
              <td className="wg-time-cell">
                <span className="wg-slot-num">{slot.slot_number}</span>
                <span className="wg-slot-time">{slot.time_start}<br />{slot.time_end}</span>
              </td>
              {days.map(day => {
                const cell = lessons.filter(
                  l => l.slot_id === slot.slot_id && l.day_of_week === day.id
                );
                return (
                  <td key={day.id} className={`wg-cell${cell.length ? " has-events" : ""}`}>
                    {cell.map(l => <CalendarEvent key={l.lesson_id} lesson={l} />)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
