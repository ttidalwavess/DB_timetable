/**
 * src/pages/admin/ReferencesPage.jsx
 *
 * /admin/references — справочники в виде вкладок.
 * Edit/Delete — пока заглушки alert('TODO'), реальный CRUD подключит
 * Участник 1 после готовности API (api.updateXxx / api.deleteXxx).
 */
import { useState, useEffect } from "react";
import { api } from "../../api";
import "./ReferencesPage.css";

const TABS = [
  { id: "departments", label: "Подразделения" },
  { id: "curriculum",  label: "Учебные планы" },
  { id: "teachers",    label: "Преподаватели" },
  { id: "rooms",       label: "Аудитории" },
  { id: "groups",      label: "Учебные группы" },
];

const GROUP_TYPE_LABELS = {
  FULL: "Целая группа", SUBGROUP: "Подгруппа", STREAM: "Поток", MIXED: "Сборная",
};

export default function ReferencesPage() {
  const [tab, setTab] = useState("departments");
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.getSchools?.() ?? Promise.resolve([]),
      api.getDepartments?.() ?? Promise.resolve([]),
      api.getCurriculumSubjects(),
      api.getSubjects(),
      api.getTeachers(),
      api.getRooms(),
      api.getBuildings(),
      api.getStudyGroups(),
      api.getAcademicGroups?.() ?? Promise.resolve([]),
    ]).then(([schools, departments, curriculumSubjects, subjects, teachers, rooms, buildings, studyGroups, academicGroups]) => {
      setData({ schools, departments, curriculumSubjects, subjects, teachers, rooms, buildings, studyGroups, academicGroups });
      setLoading(false);
    });
  }, []);

  const onEdit   = (entity, item) => alert(`TODO: редактировать ${entity} #${item.id ?? item[Object.keys(item)[0]]}`);
  const onDelete = (entity, item) => alert(`TODO: удалить ${entity} #${item.id ?? item[Object.keys(item)[0]]}`);

  return (
    <div className="refs-page">
      <div className="refs-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`btn-ghost${tab === t.id ? " active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="refs-state"><div className="sp-spinner" /></div>
      ) : (
        <div className="refs-body">
          {tab === "departments" && <DepartmentsTab data={data} onEdit={onEdit} onDelete={onDelete} />}
          {tab === "curriculum"  && <CurriculumTab  data={data} onEdit={onEdit} onDelete={onDelete} />}
          {tab === "teachers"    && <TeachersTab    data={data} onEdit={onEdit} onDelete={onDelete} />}
          {tab === "rooms"       && <RoomsTab       data={data} onEdit={onEdit} onDelete={onDelete} />}
          {tab === "groups"      && <GroupsTab      data={data} onEdit={onEdit} onDelete={onDelete} />}
        </div>
      )}
    </div>
  );
}

// ── Вкладка: Подразделения — дерево Школа → Кафедры ─────────────────────
function DepartmentsTab({ data, onEdit, onDelete }) {
  const schools = data.schools || [];
  const departments = data.departments || [];

  if (!schools.length) {
    return <EmptyState text="Нет данных о школах. Подключите api.getSchools()." />;
  }

  return (
    <div className="refs-tree">
      {schools.map(school => (
        <div key={school.school_id} className="refs-tree-school">
          <div className="refs-tree-row refs-tree-school-row">
            <span className="refs-tree-name">🏛 {school.school_name}</span>
            <div className="refs-row-actions">
              <button className="btn-ghost" onClick={() => onEdit("school", school)}>Изменить</button>
              <button className="btn-ghost" onClick={() => onDelete("school", school)}>Удалить</button>
            </div>
          </div>
          <div className="refs-tree-children">
            {departments
              .filter(d => d.school_id === school.school_id)
              .map(dep => (
                <div key={dep.department_id} className="refs-tree-row refs-tree-dep-row">
                  <span className="refs-tree-name">— {dep.department_name}</span>
                  <div className="refs-row-actions">
                    <button className="btn-ghost" onClick={() => onEdit("department", dep)}>Изменить</button>
                    <button className="btn-ghost" onClick={() => onDelete("department", dep)}>Удалить</button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Вкладка: Учебные планы — таблица дисциплин с часами ─────────────────
function CurriculumTab({ data, onEdit, onDelete }) {
  const items = data.curriculumSubjects || [];
  const subjects = data.subjects || [];

  const subjectName = (id) => subjects.find(s => s.subject_id === id)?.subject_name ?? `#${id}`;

  if (!items.length) return <EmptyState text="Дисциплины учебного плана не найдены." />;

  return (
    <table className="refs-table">
      <thead>
        <tr>
          <th>Дисциплина</th>
          <th>Семестр / план</th>
          <th>Лекции</th>
          <th>Практики</th>
          <th>Лабораторные</th>
          <th>Отчётность</th>
          <th>ЗЕТ</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {items.map(cs => (
          <tr key={cs.subj_id}>
            <td>{subjectName(cs.subject_id)}</td>
            <td className="text-muted">план #{cs.curriculum_id}</td>
            <td className="text-center">{cs.lecture_hours}</td>
            <td className="text-center">{cs.practice_hours}</td>
            <td className="text-center">{cs.lab_hours}</td>
            <td>{cs.report_type === "EXAM" ? "Экзамен" : cs.report_type === "CREDIT" ? "Зачёт" : "Экзамен + зачёт"}</td>
            <td className="text-center">{cs.credit_units}</td>
            <td className="refs-row-actions">
              <button className="btn-ghost" onClick={() => onEdit("curriculum_subject", cs)}>Изменить</button>
              <button className="btn-ghost" onClick={() => onDelete("curriculum_subject", cs)}>Удалить</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Вкладка: Преподаватели ────────────────────────────────────────────
function TeachersTab({ data, onEdit, onDelete }) {
  const teachers = data.teachers || [];
  const departments = data.departments || [];

  const deptName = (id) => departments.find(d => d.department_id === id)?.department_name ?? `Кафедра #${id}`;

  if (!teachers.length) return <EmptyState text="Преподаватели не найдены." />;

  return (
    <table className="refs-table">
      <thead>
        <tr>
          <th>ФИО</th>
          <th>Кафедра</th>
          <th>Степень / звание</th>
          <th>Должность</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {teachers.map(t => (
          <tr key={t.teacher_id}>
            <td>{t.last_name} {t.first_name} {t.middle_name}</td>
            <td>{deptName(t.department_id)}</td>
            <td className="text-muted">
              {[t.academic_degree, t.academic_rank].filter(Boolean).join(", ") || "—"}
            </td>
            <td>{t.position}</td>
            <td className="refs-row-actions">
              <button className="btn-ghost" onClick={() => onEdit("teacher", t)}>Изменить</button>
              <button className="btn-ghost" onClick={() => onDelete("teacher", t)}>Удалить</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ── Вкладка: Аудитории ─────────────────────────────────────────────────
function RoomsTab({ data, onEdit, onDelete }) {
  const rooms = data.rooms || [];
  const buildings = data.buildings || [];

  const buildingName = (id) => buildings.find(b => b.building_id === id)?.building_name ?? `Корпус #${id}`;

  if (!rooms.length) return <EmptyState text="Аудитории не найдены." />;

  return (
    <table className="refs-table">
      <thead>
        <tr>
          <th>Номер</th>
          <th>Корпус</th>
          <th>Тип</th>
          <th>Вместимость</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rooms.map(r => (
          <tr key={r.room_id}>
            <td>{r.room_number}</td>
            <td>{buildingName(r.building_id)}</td>
            <td><span className="badge badge-LEC">{ROOM_TYPE_LABEL(r.room_type)}</span></td>
            <td className="text-center">{r.is_online ? "Онлайн" : r.capacity}</td>
            <td className="refs-row-actions">
              <button className="btn-ghost" onClick={() => onEdit("room", r)}>Изменить</button>
              <button className="btn-ghost" onClick={() => onDelete("room", r)}>Удалить</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ROOM_TYPE_LABEL(type) {
  return {
    LECTURE: "Лекционная", SEMINAR: "Семинарская",
    LABORATORY: "Лаборатория", COMPUTER: "Комп. класс", HALL: "Зал",
  }[type] ?? type;
}

// ── Вкладка: Учебные группы ────────────────────────────────────────────
function GroupsTab({ data, onEdit, onDelete }) {
  const studyGroups = data.studyGroups || [];
  const academicGroups = data.academicGroups || [];

  const academicName = (id) => academicGroups.find(g => g.group_id === id)?.group_name ?? `#${id}`;

  if (!studyGroups.length) return <EmptyState text="Учебные группы не найдены." />;

  return (
    <table className="refs-table">
      <thead>
        <tr>
          <th>Название</th>
          <th>Тип</th>
          <th>Студентов</th>
          <th>Академическая группа</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {studyGroups.map(g => (
          <tr key={g.study_group_id}>
            <td>{g.study_group_name}</td>
            <td><span className="badge badge-PRAC">{GROUP_TYPE_LABELS[g.group_type] ?? g.group_type}</span></td>
            <td className="text-center">{g.student_count}</td>
            <td className="text-muted">{academicName(g.academic_group_id)}</td>
            <td className="refs-row-actions">
              <button className="btn-ghost" onClick={() => onEdit("study_group", g)}>Изменить</button>
              <button className="btn-ghost" onClick={() => onDelete("study_group", g)}>Удалить</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState({ text }) {
  return <div className="refs-state text-muted">{text}</div>;
}
