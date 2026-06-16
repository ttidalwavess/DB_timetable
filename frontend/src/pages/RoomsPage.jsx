import { useState, useEffect } from "react";
import { api } from "../api";
import { DAYS_OF_WEEK, SLOTS, ROOM_TYPE_LABELS } from "../data/mockData";
import "./RoomsPage.css";

export default function RoomsPage() {
  const [roomLoad,   setRoomLoad]   = useState({});
  const [loading,    setLoading]    = useState(false);
  const [typeFilter, setType]       = useState("ALL");
  const [buildings,  setBuildings]  = useState([]);
  const [buildFilter,setBuild]      = useState(0);
  const [selected,   setSelected]   = useState(null); // room_id для детальной таблицы

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getRoomLoad(), api.getBuildings()]).then(([load, b]) => {
      setRoomLoad(load);
      setBuildings(b);
      setLoading(false);
    });
  }, []);

  const allRooms = Object.values(roomLoad);
  const filtered = allRooms.filter(r => {
    if (typeFilter !== "ALL" && r.room.room_type !== typeFilter) return false;
    if (buildFilter && r.room.building_id !== buildFilter) return false;
    return true;
  });

  // % занятости аудитории
  const calcLoad = (roomId) => {
    const grid  = roomLoad[roomId]?.grid || {};
    const total = DAYS_OF_WEEK.length * SLOTS.length;
    const busy  = Object.values(grid).filter(arr => arr.length > 0).length;
    return total > 0 ? Math.round((busy / total) * 100) : 0;
  };

  const loadColor = (pct) => {
    if (pct >= 70) return "#db4437";
    if (pct >= 40) return "#f4b400";
    return "#0f9d58";
  };

  // Для выбранной аудитории — строим сетку день×пара
  const selectedRoom = selected ? roomLoad[selected] : null;

  return (
    <div className="rooms-page">
      {/* ── Toolbar ── */}
      <div className="rooms-toolbar">
        <div className="rooms-filters">
          <select value={typeFilter} onChange={e => setType(e.target.value)}>
            <option value="ALL">Все типы</option>
            {Object.entries(ROOM_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <select value={buildFilter} onChange={e => setBuild(Number(e.target.value))}>
            <option value={0}>Все корпуса</option>
            {buildings.map(b => (
              <option key={b.building_id} value={b.building_id}>{b.building_name}</option>
            ))}
          </select>
        </div>
        <div className="rooms-legend">
          <span className="rooms-legend-item">
            <span className="rooms-legend-sq" style={{ background: "#db443720", border: "1px solid #db4437" }} />
            Занято
          </span>
          <span className="rooms-legend-item">
            <span className="rooms-legend-sq" style={{ background: "#f8f9fa", border: "1px solid #dadce0" }} />
            Свободно
          </span>
        </div>
      </div>

      {loading ? (
        <div className="rooms-state"><div className="sp-spinner" /></div>
      ) : (
        <div className="rooms-body">
          {/* ── Карточки аудиторий ── */}
          <div className="rooms-cards">
            {filtered.map(({ room, building, typeLabel }) => {
              const pct    = calcLoad(room.room_id);
              const color  = loadColor(pct);
              const active = selected === room.room_id;
              return (
                <div
                  key={room.room_id}
                  className={`room-card${active ? " active" : ""}`}
                  onClick={() => setSelected(active ? null : room.room_id)}
                  title="Нажми чтобы посмотреть расписание"
                >
                  <div className="room-card-top">
                    <span className="room-card-num">{room.room_number}</span>
                    <span className="room-card-type-badge">{typeLabel}</span>
                  </div>
                  <div className="room-card-building">{building?.building_name}</div>
                  <div className="room-card-cap">
                    {room.is_online ? "Онлайн" : `👥 до ${room.capacity} мест`}
                  </div>
                  <div className="room-card-bar-row">
                    <div className="room-card-bar">
                      <div className="room-card-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                    <span className="room-card-pct" style={{ color }}>{pct}%</span>
                  </div>
                  <div className="room-card-hint">занято от макс.</div>
                </div>
              );
            })}
          </div>

          {/* ── Детальная сетка выбранной аудитории ── */}
          {selectedRoom && (
            <div className="rooms-detail">
              <div className="rooms-detail-header">
                <div className="rooms-detail-title">
                  {selectedRoom.room.room_number}
                  <span className="rooms-detail-sub">
                    {selectedRoom.building?.building_name} · {selectedRoom.typeLabel} · до {selectedRoom.room.capacity} мест
                  </span>
                </div>
                <button className="rooms-detail-close" onClick={() => setSelected(null)}>✕</button>
              </div>

              <div className="rooms-detail-scroll">
                <table className="rooms-detail-table">
                  <thead>
                    <tr>
                      <th className="rdt-th-slot">Пара</th>
                      {DAYS_OF_WEEK.map(d => <th key={d.id} className="rdt-th-day">{d.name}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {SLOTS.map(slot => (
                      <tr key={slot.slot_id}>
                        <td className="rdt-td-slot">
                          <div className="rdt-slot-num">{slot.slot_number}</div>
                          <div className="rdt-slot-time">{slot.time_start}–{slot.time_end}</div>
                        </td>
                        {DAYS_OF_WEEK.map(day => {
                          const key     = `${day.id}_${slot.slot_id}`;
                          const lessons = (selectedRoom.grid || {})[key] || [];
                          const busy    = lessons.length > 0;
                          return (
                            <td key={day.id} className={`rdt-td-cell ${busy ? "busy" : "free"}`}>
                              {busy ? (
                                lessons.map(l => (
                                  <div key={l.lesson_id} className="rdt-event">
                                    <div className="rdt-event-group">{l.groupName}</div>
                                    <div className="rdt-event-subj">{l.subjectName}</div>
                                    <div className="rdt-event-teacher">{l.teacherShort}</div>
                                    {l.week_parity !== "BOTH" && (
                                      <div className="rdt-event-week">
                                        {l.week_parity === "ODD" ? "нечёт." : "чёт."}
                                      </div>
                                    )}
                                  </div>
                                ))
                              ) : (
                                <div className="rdt-free">свободно</div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Сводная таблица всех аудиторий ── */}
          {!selectedRoom && (
            <div className="rooms-overview">
              <div className="rooms-overview-title">Сводная занятость — нажми на аудиторию выше для деталей</div>
              <div className="rooms-overview-scroll">
                <table className="rooms-overview-table">
                  <thead>
                    <tr>
                      <th className="rot-th-slot">День / Пара</th>
                      {filtered.map(({ room }) => (
                        <th key={room.room_id} className="rot-th-room"
                          onClick={() => setSelected(room.room_id)}
                          style={{ cursor: "pointer" }}
                          title="Нажми для деталей"
                        >
                          {room.room_number}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS_OF_WEEK.map(day =>
                      SLOTS.map((slot, si) => (
                        <tr key={`${day.id}_${slot.slot_id}`}>
                          {si === 0 && (
                            <td className="rot-td-day" rowSpan={SLOTS.length}>{day.short}</td>
                          )}
                          {filtered.map(({ room }) => {
                            const key     = `${day.id}_${slot.slot_id}`;
                            const lessons = (roomLoad[room.room_id]?.grid || {})[key] || [];
                            const busy    = lessons.length > 0;
                            return (
                              <td
                                key={room.room_id}
                                className={`rot-td-cell ${busy ? "busy" : "free"}`}
                                title={busy
                                  ? lessons.map(l => `${l.groupName} — ${l.subjectName}`).join("\n")
                                  : "Свободно"
                                }
                                onClick={() => setSelected(room.room_id)}
                              >
                                {busy ? (
                                  <div className="rot-cell-busy">
                                    <span className="rot-slot-n">{slot.slot_number}</span>
                                    <span className="rot-group">{lessons[0].groupName}</span>
                                  </div>
                                ) : (
                                  <span className="rot-slot-free">{slot.slot_number}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
