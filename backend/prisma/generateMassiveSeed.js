const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const SCALE = {
  schools: 2,
  depsPerSchool: 2,
  programsPerDep: 2,
  groupsPerProgram: 2,
  teachersPerDep: 4,
  roomsPerBuilding: 10,
  subjectsTotal: 15
};

const MOCK_NAMES = ["Иванов", "Петров", "Сидоров", "Смирнов", "Кузнецов", "Попов", "Соколов", "Лебедев", "Козлов", "Новиков", "Морозов", "Волков", "Алексеев", "Лебедев", "Павлов"];
const MOCK_FIRST = ["Александр", "Дмитрий", "Максим", "Сергей", "Андрей", "Алексей", "Артём", "Илья", "Кирилл", "Михаил"];
const MOCK_MID = ["Александрович", "Дмитриевич", "Сергеевич", "Андреевич", "Алексеевич", "Иванович", "Петрович", "Владимирович"];

const SUBJECT_NAMES = ["Высшая математика", "Физика", "Программирование на C++", "Базы данных", "Web-разработка", "Сети и телекоммуникации", "Английский язык", "История", "Философия", "Экономика", "Информационная безопасность", "Алгоритмы и структуры данных", "Операционные системы", "Машинное обучение", "Программная инженерия"];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

async function clearDatabase() {
  console.log("Очистка базы данных...");
  await prisma.transfer.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.schedule.deleteMany({});
  await prisma.teacher_preference.deleteMany({});
  await prisma.teacher_assignment.deleteMany({});
  await prisma.curriculum_subject.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.curriculum.deleteMany({});
  await prisma.study_group.deleteMany({});
  await prisma.academic_group.deleteMany({});
  await prisma.training_program.deleteMany({});
  await prisma.teacher.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.school.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.building_distance.deleteMany({});
  await prisma.building.deleteMany({});
  // calendar_day и slot не трогаем, они базовые
}

async function generateData() {
  await clearDatabase();
  console.log("Генерация структуры ВУЗа...");

  // 1. Корпуса и Аудитории
  const buildingA = await prisma.building.create({ data: { building_name: 'Корпус А (Главный)', address: 'ул. Центральная, 1' } });
  const buildingB = await prisma.building.create({ data: { building_name: 'Корпус Б (Лабораторный)', address: 'ул. Центральная, 2' } });

  const rooms = [];
  for(let i=1; i<=SCALE.roomsPerBuilding; i++) {
    rooms.push(await prisma.room.create({ data: { room_number: `А-10${i}`, room_type: 'LECTURE', capacity: 100, building_id: buildingA.building_id }}));
    rooms.push(await prisma.room.create({ data: { room_number: `А-20${i}`, room_type: 'SEMINAR', capacity: 30, building_id: buildingA.building_id }}));
    rooms.push(await prisma.room.create({ data: { room_number: `Б-10${i}`, room_type: 'LABORATORY', capacity: 20, building_id: buildingB.building_id }}));
    rooms.push(await prisma.room.create({ data: { room_number: `Б-20${i}`, room_type: 'COMPUTER', capacity: 25, building_id: buildingB.building_id }}));
  }

  // 2. Предметы
  const subjects = [];
  for (let name of SUBJECT_NAMES) {
    subjects.push(await prisma.subject.create({ data: { subject_name: name } }));
  }

  // 3. Институты, Кафедры, Направления, Группы, Преподаватели
  const teachers = [];
  const studyGroups = [];
  const curriculums = [];
  const assignments = [];
  const currSubjects = [];

  for (let s=1; s<=SCALE.schools; s++) {
    const school = await prisma.school.create({ data: { school_name: `Институт №${s}` } });
    
    for (let d=1; d<=SCALE.depsPerSchool; d++) {
      const dep = await prisma.department.create({ data: { department_name: `Кафедра ${s}-${d}`, school_id: school.school_id } });
      
      for (let t=1; t<=SCALE.teachersPerDep; t++) {
        teachers.push(await prisma.teacher.create({
          data: {
            last_name: randomItem(MOCK_NAMES),
            first_name: randomItem(MOCK_FIRST),
            middle_name: randomItem(MOCK_MID),
            department_id: dep.department_id,
            position: 'Доцент'
          }
        }));
      }

      for (let p=1; p<=SCALE.programsPerDep; p++) {
        const prog = await prisma.training_program.create({
          data: {
            program_name: `Направление ${s}-${d}-${p}`,
            degree_level: 'BACHELOR',
            duration_years: 4,
            department_id: dep.department_id
          }
        });

        // Учебный план для этого направления
        const curr = await prisma.curriculum.create({
          data: { program_id: prog.program_id, year_number: 1, semester_number: 1 }
        });
        curriculums.push(curr);

        // Привязываем 4 случайных предмета к плану
        for (let i=0; i<4; i++) {
          const sub = randomItem(subjects);
          // чтобы не было дублей в плане
          if (currSubjects.find(cs => cs.curriculum_id === curr.curriculum_id && cs.subject_id === sub.subject_id)) continue;
          
          const cs = await prisma.curriculum_subject.create({
            data: {
              curriculum_id: curr.curriculum_id,
              subject_id: sub.subject_id,
              lecture_hours: 36,
              practice_hours: 18,
              lab_hours: 0,
              report_type: 'EXAM',
              credit_units: 3.0
            }
          });
          currSubjects.push(cs);

          // Назначаем случайного препода с этой кафедры на этот предмет
          const depTeachers = teachers.filter(tch => tch.department_id === dep.department_id);
          if (depTeachers.length > 0) {
            const tch = randomItem(depTeachers);
            // Проверка дублей поручений
            if (!assignments.find(a => a.teacher_id === tch.teacher_id && a.subj_id === cs.subj_id)) {
              assignments.push(await prisma.teacher_assignment.create({
                data: {
                  teacher_id: tch.teacher_id,
                  subj_id: cs.subj_id,
                  lesson_types: 'LEC,PRAC'
                }
              }));
            }
          }
        }

        // Группы
        for (let g=1; g<=SCALE.groupsPerProgram; g++) {
          const ag = await prisma.academic_group.create({
            data: {
              group_name: `ГР-${s}${d}${p}-${g}`,
              program_id: prog.program_id,
              year_of_enrollment: 2026
            }
          });
          studyGroups.push(await prisma.study_group.create({
            data: {
              study_group_name: `ГР-${s}${d}${p}-${g}`,
              group_type: 'FULL',
              student_count: randomInt(20, 30),
              academic_group_id: ag.group_id
            }
          }));
        }
      }
    }
  }

  console.log("Генерация Расписания (Алгоритм)...");
  const schedule = await prisma.schedule.create({
    data: {
      schedule_name: "Генерация 2026",
      curriculum_id: curriculums[0].curriculum_id,
      academic_year: 2026,
      semester_number: 1,
      date_start: new Date('2026-09-01'),
      date_end: new Date('2026-12-31'),
      week_count: 18,
      is_active: true
    }
  });

  // Структуры для отслеживания коллизий
  // [day][slot][id]
  const roomGrid = {};
  const teacherGrid = {};
  const groupGrid = {};
  const groupDayCount = {};
  const teacherDayCount = {};

  for(let d=1; d<=6; d++) {
    roomGrid[d] = {}; teacherGrid[d] = {}; groupGrid[d] = {};
    groupDayCount[d] = {}; teacherDayCount[d] = {};
    for(let s=1; s<=8; s++) {
      roomGrid[d][s] = {}; teacherGrid[d][s] = {}; groupGrid[d][s] = {};
    }
  }

  const newLessons = [];

  for (let sg of studyGroups) {
    const ag = await prisma.academic_group.findUnique({ where: { group_id: sg.academic_group_id } });
    const curr = curriculums.find(c => c.program_id === ag.program_id);
    if (!curr) continue;

    const subjectsForGroup = currSubjects.filter(cs => cs.curriculum_id === curr.curriculum_id);
    
    for (let cs of subjectsForGroup) {
      // Ищем препода для предмета
      const assignment = assignments.find(a => a.subj_id === cs.subj_id);
      if (!assignment) continue;

      // Хотим поставить 1 лекцию и 1 практику в неделю
      const requiredTypes = ['LEC', 'PRAC'];
      
      for (let lType of requiredTypes) {
        let placed = false;
        
        // Пытаемся найти окно
        for (let day=1; day<=5 && !placed; day++) {
          for (let slot=1; slot<=4 && !placed; slot++) { // пары с 1 по 4 (т.к. в БД только 4 слота)
            
            if (groupGrid[day][slot][sg.study_group_id]) continue;
            if (teacherGrid[day][slot][assignment.teacher_id]) continue;
            if ((groupDayCount[day][sg.study_group_id] || 0) >= 5) continue;
            if ((teacherDayCount[day][assignment.teacher_id] || 0) >= 5) continue;

            // Ищем свободную аудиторию
            const availableRoom = rooms.find(r => 
              !roomGrid[day][slot][r.room_id] && 
              r.capacity >= sg.student_count &&
              (lType === 'LEC' ? r.room_type === 'LECTURE' : r.room_type === 'SEMINAR')
            );

            if (availableRoom) {
              // ЗАНИМАЕМ!
              groupGrid[day][slot][sg.study_group_id] = true;
              teacherGrid[day][slot][assignment.teacher_id] = true;
              roomGrid[day][slot][availableRoom.room_id] = true;
              
              groupDayCount[day][sg.study_group_id] = (groupDayCount[day][sg.study_group_id] || 0) + 1;
              teacherDayCount[day][assignment.teacher_id] = (teacherDayCount[day][assignment.teacher_id] || 0) + 1;

              newLessons.push({
                schedule_id: schedule.schedule_id,
                study_group_id: sg.study_group_id,
                subj_id: cs.subj_id,
                assignment_id: assignment.assignment_id,
                room_id: availableRoom.room_id,
                slot_id: slot,
                lesson_type: lType,
                day_of_week: day,
                week_parity: 'BOTH',
                is_recurring: true,
                location_type: 'ROOM'
              });

              placed = true;
            }
          }
        }
      }
    }
  }

  console.log(`Готово к вставке: ${newLessons.length} занятий. Сохраняем...`);
  if (newLessons.length > 0) {
    console.log("Первое занятие:", newLessons[0]);
  }
  // Массовая вставка частями, чтобы не перегрузить память
  const chunkSize = 500;
  for (let i=0; i<newLessons.length; i+=chunkSize) {
    try {
      await prisma.lesson.createMany({ data: newLessons.slice(i, i+chunkSize) });
    } catch(e) {
      console.error("Ошибка при вставке:", e);
      throw e;
    }
  }

  console.log("✅ БАЗА ДАННЫХ УСПЕШНО СГЕНЕРИРОВАНА!");
  console.log(`Создано: Институтов - ${SCALE.schools}, Групп - ${studyGroups.length}, Занятий - ${newLessons.length}`);
}

generateData()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
