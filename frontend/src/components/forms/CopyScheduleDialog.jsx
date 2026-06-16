/**копирование расписания: «Новое название» + выбор семестра.
 *  - название не пустое
 *  - название не дублирует существующее расписание (проверяет api.copySchedule)
 *  - семестр выбран (1–12)
 */
import { useState } from "react";
import { api } from "../../api";
import "./CopyScheduleDialog.css";

export default function CopyScheduleDialog({
  sourceSchedule,   // { schedule_id, schedule_name, academic_year, semester_number }
  onCopied,         // (newSchedule) => void
  onCancel,
}) {
  const [name, setName] = useState(`${sourceSchedule.schedule_name} (копия)`);
  const [academicYear, setAcademicYear] = useState(sourceSchedule.academic_year);
  const [semesterNumber, setSemesterNumber] = useState(sourceSchedule.semester_number);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const next = {};
    if (!name.trim()) next.name = "Введите название нового расписания";
    if (!academicYear || academicYear < 2000) next.academicYear = "Укажите корректный год";
    if (!semesterNumber || semesterNumber < 1 || semesterNumber > 12) {
      next.semesterNumber = "Номер семестра должен быть от 1 до 12";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const result = await api.copySchedule({
        sourceScheduleId: sourceSchedule.schedule_id,
        name,
        academicYear,
        semesterNumber,
      });
      onCopied?.(result);
    } catch (err) {
      if (err.fieldErrors) {
        setErrors(err.fieldErrors);
      } else {
        setErrors({ form: err.message || "Не удалось скопировать расписание" });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="csd-form" onSubmit={handleSubmit}>
      <h3 className="csd-title">Копировать расписание</h3>
      <p className="csd-source">
        Источник: <strong>{sourceSchedule.schedule_name}</strong>
      </p>

      <div className="lf-field">
        <label className="lf-label">Новое название</label>
        <input
          className="lf-input"
          value={name}
          onChange={e => setName(e.target.value)}
          autoFocus
        />
        {errors.name && <div className="lf-hint lf-hint-error">{errors.name}</div>}
      </div>

      <div className="lf-row">
        <div className="lf-field">
          <label className="lf-label">Учебный год</label>
          <input
            type="number"
            className="lf-input"
            value={academicYear}
            onChange={e => setAcademicYear(Number(e.target.value))}
          />
          {errors.academicYear && <div className="lf-hint lf-hint-error">{errors.academicYear}</div>}
        </div>

        <div className="lf-field">
          <label className="lf-label">Семестр</label>
          <select
            className="lf-input"
            value={semesterNumber}
            onChange={e => setSemesterNumber(Number(e.target.value))}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map(n => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          {errors.semesterNumber && <div className="lf-hint lf-hint-error">{errors.semesterNumber}</div>}
        </div>
      </div>

      {errors.form && <div className="lf-submit-error">{errors.form}</div>}

      <div className="lf-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Отмена</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Копирование…" : "Скопировать"}
        </button>
      </div>
    </form>
  );
}
