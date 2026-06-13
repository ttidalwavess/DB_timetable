import { useState, useEffect } from "react";
import { api } from "../api";
import { DAYS_OF_WEEK, SLOTS, ROOM_TYPE_LABELS } from "../data/mockData";
import "./RoomsPage.css";

const ROOM_TYPES = Object.keys(ROOM_TYPE_LABELS);

export default function RoomsPage() {
  const [roomLoad, setRoomLoad] = useState({});
  const [loading,  setLoading]  = useState(false);
  const [typeFilter, setType]   = useState("ALL");
  const [buildFilter, setBuild] = useState(0);
  const [buildings, setBuildings] = useState([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getRoomLoad(), api.getBuildings()]).then(([load, b]) => {
      setRoomLoad(load);
      setBuildings(b);
      setLoading(false);
    });
  }, []);

  const allRooms = Object.values(roomLoad);
  const filteredRooms = allRooms.filter(r => {
    if (typeFilter !== "ALL" && r.room.room_type !== typeFilter) return false;
    if (buildFilter && r.room.building_id !== buildFilter) return false;
    return true;
  });

  const calcLoad = (room) => {
    const total = DAYS_OF_WEEK.length * SLOTS.length;
    const busy  = Object.values(room.slots || room.grid || {}).filter(arr => arr.length > 0).length;
    return total > 0 ? Math.round((busy / total) * 100) : 0;
  };

  return (
    <div className="rooms-page">
      {/* Toolbar */}
      <div className="rooms-toolbar">
        <div className="rooms-filters">
          <select value={typeFilter} onChange={e => setType(e.target.value)}>
            <option value="ALL">Все типы</option>
            {ROOM_TYPES.map(t => <option key={t} value={t}>{ROOM_TYPE_LABELS[t]}</option>)}
          </select>
          <select value={buildFilter} onChange={e => setBuild(Number(e.target.value))}>
            <option value={0}>Все корпуса</option>
            {buildings.map(b => <option key={b.building_id} value={b.building_id}>{b.building_name}</option>)}
          </select>
        </div>
        <div className="rooms-legend">
          <span className="rooms-legend-item"><span className="rooms-legend-sq busy"/>Занято</span>
          <span className="rooms-legend-item"><span className="rooms-legend-sq free"/>Свободно</span>
        </div>
      </div>

      {loading ? (
        <div className="rooms-state"><div className="sp-spinner"/></div>
      ) : (
        <>
          {/* Room stat cards */}
          <div className="rooms-cards">
            {filteredRooms.map(({ room, building, typeLabel }) => {
              const pct = calcLoad({ grid: roomLoad[room.room_id]?.grid || {} });
              return (
                <div key={room.room_id} className="room-card">
                  <div className="room-card-header">
                    <span className="room-card-num">{room.room_number}</span>
                    <span className="room-card-type">{typeLabel}</span>
                  </div>
                  <div className="room-card-building">{building?.building_name}</div>
                  <div className="room-card-cap">👥 {room.is_online ? "Онлайн" : `до ${room.capacity} мест`}</div>
                  <div className="room-card-bar">
                    <div className="room-card-fill" style={{ width: `${pct}%`, background: pct > 70 ? "#DB4437" : pct > 40 ? "#F4B400" : "#0F9D58" }} />
                  </div>
                  <div className="room-card-pct text-muted text-sm">{pct}% загрузки</div>
                </div>
              );
            })}
          </div>

          {/* Detail table */}
          <div className="rooms-table-wrap">
            <p className="rooms-table-title">Детальная занятость по парам</p>
            <div className="rooms-scroll">
              <table className="rooms-table">
                <thead>
                  <tr>
                    <th className="rooms-th-slot">Пара</th>
                    {filteredRooms.map(({ room }) => (
                      <th key={room.room_id} className="rooms-th-room">
                        <div>{room.room_number}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {DAYS_OF_WEEK.map(day => (
                    SLOTS.map((slot, si) => {
                      const key = `${day.id}_${slot.slot_id}`;
                      return (
                        <tr key={key}>
                          {si === 0 ? (
                            <td className="rooms-td-day" rowSpan={SLOTS.length}>{day.short}</td>
                          ) : null}
                          {si !== 0 ? null : null}
                          {filteredRooms.map(({ room }) => {
                            const grid = roomLoad[room.room_id]?.grid || {};
                            const lessons = grid[key] || [];
                            const busy = lessons.length > 0;
                            return (
                              <td
                                key={room.room_id}
                                className={`rooms-td-cell ${busy ? "busy" : "free"}`}
                                title={busy ? lessons.map(l => `${l.groupName} — ${l.subjectName}`).join("\n") : "Свободно"}
                              >
                                {busy ? (
                                  <div className="rooms-cell-content">
                                    <div className="rooms-cell-slot">{slot.slot_number}</div>
                                    <div className="rooms-cell-group">{lessons[0].groupName}</div>
                                  </div>
                                ) : (
                                  <div className="rooms-cell-slot text-muted">{slot.slot_number}</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
