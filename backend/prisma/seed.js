const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Начинаем заполнение базы тестовыми данными...');

  // 1. Создаем слоты (расписание звонков)
  const slotsData = [
    { slot_id: 1, slot_number: 1, time_start: new Date('1970-01-01T08:30:00Z'), time_end: new Date('1970-01-01T10:00:00Z') },
    { slot_id: 2, slot_number: 2, time_start: new Date('1970-01-01T10:10:00Z'), time_end: new Date('1970-01-01T11:40:00Z') },
    { slot_id: 3, slot_number: 3, time_start: new Date('1970-01-01T11:50:00Z'), time_end: new Date('1970-01-01T13:20:00Z') },
    { slot_id: 4, slot_number: 4, time_start: new Date('1970-01-01T13:30:00Z'), time_end: new Date('1970-01-01T15:00:00Z') },
  ];
  
  for (const slot of slotsData) {
    await prisma.slot.upsert({
      where: { slot_number: slot.slot_number },
      update: {},
      create: slot,
    });
  }

  // 2. Создаем факультет (School) и кафедру (Department)
  const school = await prisma.school.upsert({
    where: { school_name: 'Факультет информационных технологий' },
    update: {},
    create: { school_name: 'Факультет информационных технологий' }
  });

  const department = await prisma.department.upsert({
    where: { department_name_school_id: { department_name: 'Кафедра программной инженерии', school_id: school.school_id } },
    update: {},
    create: { department_name: 'Кафедра программной инженерии', school_id: school.school_id }
  });

  // 3. Создаем преподавателя
  const teacher = await prisma.teacher.create({
    data: {
      last_name: 'Иванов',
      first_name: 'Иван',
      middle_name: 'Иванович',
      department_id: department.department_id,
      position: 'Доцент'
    }
  });

  // 4. Создаем корпус и аудиторию
  const building = await prisma.building.upsert({
    where: { building_name: 'Главный корпус' },
    update: {},
    create: { building_name: 'Главный корпус' }
  });

  const room = await prisma.room.upsert({
    where: { room_number_building_id: { room_number: 'А-101', building_id: building.building_id } },
    update: {},
    create: { room_number: 'А-101', room_type: 'LECTURE', capacity: 100, building_id: building.building_id }
  });

  // 5. Создаем направление, группу и подгруппу
  const program = await prisma.training_program.create({
    data: {
      program_name: 'Программная инженерия',
      degree_level: 'Бакалавриат',
      duration_years: 4,
      department_id: department.department_id
    }
  });

  const academicGroup = await prisma.academic_group.upsert({
    where: { group_name: 'ПИ-21' },
    update: {},
    create: { group_name: 'ПИ-21', program_id: program.program_id, year_of_enrollment: 2021 }
  });

  const studyGroup = await prisma.study_group.upsert({
    where: { study_group_name: 'ПИ-21-1' },
    update: {},
    create: { study_group_name: 'ПИ-21-1', group_type: 'SUBGROUP', student_count: 25, academic_group_id: academicGroup.group_id }
  });

  // 6. Создаем дисциплину и привязку (Учебный план)
  const subject = await prisma.subject.upsert({
    where: { subject_name: 'Базы данных' },
    update: {},
    create: { subject_name: 'Базы данных' }
  });

  const curriculum = await prisma.curriculum.upsert({
    where: { program_id_year_number_semester_number: { program_id: program.program_id, year_number: 3, semester_number: 5 } },
    update: {},
    create: { program_id: program.program_id, year_number: 3, semester_number: 5 }
  });

  const currSubject = await prisma.curriculum_subject.upsert({
    where: { curriculum_id_subject_id: { curriculum_id: curriculum.curriculum_id, subject_id: subject.subject_id } },
    update: {},
    create: { curriculum_id: curriculum.curriculum_id, subject_id: subject.subject_id, lecture_hours: 36, report_type: 'EXAM', credit_units: 3 }
  });

  // 7. Назначаем преподавателя на эту дисциплину
  const assignment = await prisma.teacher_assignment.upsert({
    where: { teacher_id_subj_id: { teacher_id: teacher.teacher_id, subj_id: currSubject.subj_id } },
    update: {},
    create: { teacher_id: teacher.teacher_id, subj_id: currSubject.subj_id, lesson_types: 'LECTURE,PRACTICE' }
  });

  // 8. Создаем само расписание (семестр)
  const schedule = await prisma.schedule.create({
    data: {
      schedule_name: 'Осень 2024',
      curriculum_id: curriculum.curriculum_id,
      academic_year: 2024,
      semester_number: 5,
      date_start: new Date('2024-09-01'),
      date_end: new Date('2024-12-31'),
      week_count: 18,
      is_active: true
    }
  });

  console.log('Тестовые данные успешно созданы!');
  console.log(`Расписание ID: ${schedule.schedule_id}`);
  console.log(`Подгруппа ID: ${studyGroup.study_group_id}`);
  console.log(`Преподаватель Назначение ID: ${assignment.assignment_id}`);
  console.log(`Комната ID: ${room.room_id}`);
  console.log(`Слот ID: ${slotsData[0].slot_id}`);
  console.log(`Дисциплина (curriculum_subject) ID: ${currSubject.subj_id}`);
}

main()
  .catch((e) => {
    console.error('Ошибка заполнения базы:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
