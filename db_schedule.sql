CREATE SCHEMA IF NOT EXISTS schedule;
SET search_path TO schedule;

CREATE TABLE slot (
    slot_id         SMALLINT        PRIMARY KEY,    -- 1..8, задаётся вручную
    slot_number     SMALLINT        NOT NULL UNIQUE CHECK (slot_number BETWEEN 1 AND 8),
    time_start      TIME            NOT NULL,
    time_end        TIME            NOT NULL,
    CHECK (time_end > time_start)
);
COMMENT ON TABLE  slot             IS 'Справочник пар (расписание звонков). Заполняется один раз для всего вуза.';
COMMENT ON COLUMN slot.slot_number IS 'Порядковый номер пары (1–8)';


CREATE TABLE school (
    school_id       SERIAL          PRIMARY KEY,
    school_name     VARCHAR(150)    NOT NULL UNIQUE,
    created_at      TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE school IS 'Школы (факультеты / институты). Верхний уровень иерархии подразделений.';

CREATE TABLE department (
    department_id   SERIAL          PRIMARY KEY,
    department_name VARCHAR(150)    NOT NULL,
    school_id       INTEGER         NOT NULL
                        REFERENCES school(school_id) ON DELETE RESTRICT,
    created_at      TIMESTAMP       DEFAULT NOW(),
    UNIQUE (department_name, school_id)
);
COMMENT ON TABLE  department           IS 'Кафедры / департаменты. Подчиняются школе.';
COMMENT ON COLUMN department.school_id IS 'FK → SCHOOL';

CREATE TABLE training_program (
    program_id      SERIAL          PRIMARY KEY,
    program_name    VARCHAR(150)    NOT NULL,
    degree_level    VARCHAR(20)     NOT NULL
                        CHECK (degree_level IN ('BACHELOR','MASTER','SPECIALIST')),
    duration_years  SMALLINT        NOT NULL CHECK (duration_years BETWEEN 2 AND 6),
    department_id   INTEGER,        -- FK → department; добавляется через ALTER TABLE ниже
    created_at      TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE  training_program                IS 'Направления подготовки (специальности). '
    'Каждое направление закреплено за кафедрой (department_id): '
    'студент через academic_group → training_program сразу знает свою кафедру и школу.';
COMMENT ON COLUMN training_program.degree_level   IS 'BACHELOR | MASTER | SPECIALIST';
COMMENT ON COLUMN training_program.duration_years IS 'Нормативный срок обучения (4 или 5 лет)';
COMMENT ON COLUMN training_program.department_id  IS 'Кафедра-владелец направления. '
    'Цепочка: студент → academic_group → training_program → department → school.';

-- FK и индекс: training_program → department
-- (department уже создана выше, поэтому здесь всё корректно)
ALTER TABLE training_program
    ADD CONSTRAINT fk_program_department
    FOREIGN KEY (department_id)
    REFERENCES department(department_id)
    ON DELETE RESTRICT;

CREATE INDEX idx_program_department ON training_program(department_id);


CREATE TABLE curriculum (
    curriculum_id   SERIAL          PRIMARY KEY,
    program_id      INTEGER         NOT NULL
                        REFERENCES training_program(program_id) ON DELETE RESTRICT,
    year_number     SMALLINT        NOT NULL CHECK (year_number BETWEEN 1 AND 6),
    semester_number SMALLINT        NOT NULL CHECK (semester_number BETWEEN 1 AND 12),
    created_at      TIMESTAMP       DEFAULT NOW(),
    UNIQUE (program_id, year_number, semester_number)
);
COMMENT ON TABLE  curriculum                IS 'Учебный план: привязка направления к конкретному году и семестру';
COMMENT ON COLUMN curriculum.year_number    IS 'Год обучения (1–5)';
COMMENT ON COLUMN curriculum.semester_number IS 'Сквозной номер семестра (1–10)';


CREATE TABLE subject (
    subject_id      SERIAL          PRIMARY KEY,
    subject_name    VARCHAR(150)    NOT NULL UNIQUE,
    description     TEXT,
    created_at      TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE subject IS 'Единый справочник дисциплин. Не привязан к конкретному плану.';


CREATE TABLE curriculum_subject (
    subj_id         SERIAL          PRIMARY KEY,
    curriculum_id   INTEGER         NOT NULL
                        REFERENCES curriculum(curriculum_id) ON DELETE RESTRICT,
    subject_id      INTEGER         NOT NULL
                        REFERENCES subject(subject_id) ON DELETE RESTRICT,
    lecture_hours   SMALLINT        NOT NULL DEFAULT 0 CHECK (lecture_hours >= 0),
    practice_hours  SMALLINT        NOT NULL DEFAULT 0 CHECK (practice_hours >= 0),
    lab_hours       SMALLINT        NOT NULL DEFAULT 0 CHECK (lab_hours >= 0),
    report_type     VARCHAR(10)     NOT NULL
                        CHECK (report_type IN ('EXAM','CREDIT','BOTH')),
    credit_units    NUMERIC(4,1)    NOT NULL CHECK (credit_units > 0),
    created_at      TIMESTAMP       DEFAULT NOW(),
    UNIQUE (curriculum_id, subject_id)
);
COMMENT ON TABLE  curriculum_subject              IS 'Дисциплины учебного плана с часами по видам занятий';
COMMENT ON COLUMN curriculum_subject.report_type  IS 'Вид отчётности: EXAM=экзамен, CREDIT=зачёт, BOTH=оба';
COMMENT ON COLUMN curriculum_subject.credit_units IS 'Зачётные единицы трудоёмкости (ЗЕТ). 1 ЗЕТ = 36 ак. ч.';
CREATE INDEX idx_cs_curriculum ON curriculum_subject(curriculum_id);


CREATE TABLE teacher (
    teacher_id      SERIAL          PRIMARY KEY,
    last_name       VARCHAR(50)     NOT NULL,
    first_name      VARCHAR(50)     NOT NULL,
    middle_name     VARCHAR(50),
    department_id   INTEGER         NOT NULL
                        REFERENCES department(department_id) ON DELETE RESTRICT,
    academic_degree VARCHAR(50),                    -- канд. наук / д-р наук / NULL
    academic_rank   VARCHAR(50),                    -- доцент / профессор / NULL
    position        VARCHAR(80)     NOT NULL,       -- ст. преподаватель, доцент, …
    created_at      TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE  teacher                  IS 'Преподаватели университета';
COMMENT ON COLUMN teacher.academic_degree  IS 'Учёная степень: канд. наук | д-р наук | NULL';
COMMENT ON COLUMN teacher.academic_rank    IS 'Учёное звание: доцент | профессор | NULL';
COMMENT ON COLUMN teacher.position         IS 'Должность: ассистент | ст. преподаватель | доцент | профессор';
CREATE INDEX idx_teacher_department ON teacher(department_id);


CREATE TABLE teacher_assignment (
    assignment_id   SERIAL          PRIMARY KEY,
    teacher_id      INTEGER         NOT NULL
                        REFERENCES teacher(teacher_id) ON DELETE RESTRICT,
    subj_id         INTEGER         NOT NULL
                        REFERENCES curriculum_subject(subj_id) ON DELETE RESTRICT,
    -- Допустимые виды занятий: через запятую, напр. 'LEC,PRAC'
    -- Проверка гибко через CHECK или обрабатывается в приложении
    lesson_types    VARCHAR(60)     NOT NULL,
    created_at      TIMESTAMP       DEFAULT NOW(),
    UNIQUE (teacher_id, subj_id)
);
COMMENT ON TABLE  teacher_assignment              IS 'Учебные поручения: какой преподаватель какие виды занятий ведёт по дисциплине';
COMMENT ON COLUMN teacher_assignment.lesson_types IS 'Допустимые типы занятий через запятую: LEC,PRAC,LAB,EXAM,CREDIT,CONSUL';
CREATE INDEX idx_ta_teacher ON teacher_assignment(teacher_id);
CREATE INDEX idx_ta_subject ON teacher_assignment(subj_id);


CREATE TABLE academic_group (
    group_id            SERIAL          PRIMARY KEY,
    group_name          VARCHAR(20)     NOT NULL UNIQUE,
    program_id          INTEGER         NOT NULL
                            REFERENCES training_program(program_id) ON DELETE RESTRICT,
    year_of_enrollment  SMALLINT        NOT NULL,
    created_at          TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE  academic_group                  IS 'Академические группы (номер группы одной специальности)';
COMMENT ON COLUMN academic_group.group_name       IS 'Уникальное название, напр. 22-ИБ-1';
COMMENT ON COLUMN academic_group.year_of_enrollment IS 'Год поступления';


CREATE TABLE study_group (
    study_group_id      SERIAL          PRIMARY KEY,
    study_group_name    VARCHAR(50)     NOT NULL UNIQUE,
    group_type          VARCHAR(10)     NOT NULL
                            CHECK (group_type IN ('FULL','SUBGROUP','STREAM','MIXED')),
    student_count       SMALLINT        NOT NULL CHECK (student_count >= 1),
    academic_group_id   INTEGER         NOT NULL
                            REFERENCES academic_group(group_id) ON DELETE RESTRICT,
    created_at          TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE  study_group              IS 'Учебные группы: целая, подгруппа, поток или сборная';
COMMENT ON COLUMN study_group.group_type   IS 'FULL=вся академическая, SUBGROUP=подгруппа, STREAM=поток, MIXED=сборная (физкультура и др.)';
COMMENT ON COLUMN study_group.student_count IS 'Количество студентов — для проверки вместимости аудитории';


CREATE TABLE building (
    building_id     SERIAL          PRIMARY KEY,
    building_name   VARCHAR(50)     NOT NULL UNIQUE,
    address         VARCHAR(200),
    created_at      TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE building IS 'Корпуса (отдельно стоящие здания) университета';


CREATE TABLE building_distance (
    from_building_id INTEGER         NOT NULL
                         REFERENCES building(building_id) ON DELETE CASCADE,
    to_building_id   INTEGER         NOT NULL
                         REFERENCES building(building_id) ON DELETE CASCADE,
    travel_minutes   SMALLINT        NOT NULL CHECK (travel_minutes >= 0),
    PRIMARY KEY (from_building_id, to_building_id),
    CHECK (from_building_id <> to_building_id)
);
COMMENT ON TABLE  building_distance                IS 'Матрица времени пешего перемещения между корпусами (в минутах)';
COMMENT ON COLUMN building_distance.travel_minutes IS 'Минуты ходьбы. Используется при проверке ограничения 8.';


CREATE TABLE room (
    room_id         SERIAL          PRIMARY KEY,
    room_number     VARCHAR(20)     NOT NULL,
    room_type       VARCHAR(20)     NOT NULL
                        CHECK (room_type IN ('LECTURE','SEMINAR','LABORATORY','COMPUTER','HALL')),
    capacity        SMALLINT        NOT NULL CHECK (capacity >= 1),
    building_id     INTEGER         NOT NULL
                        REFERENCES building(building_id) ON DELETE RESTRICT,
    is_online       BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT NOW(),
    UNIQUE (room_number, building_id)
);
COMMENT ON TABLE  room             IS 'Учебные помещения. Аудитории, лаборатории, компьютерные классы, залы.';
COMMENT ON COLUMN room.room_type   IS 'LECTURE=лекционная, SEMINAR=семинарская, LABORATORY=лаборатория, COMPUTER=комп.класс, HALL=зал';
COMMENT ON COLUMN room.capacity    IS 'Кол-во посадочных мест. Проверяется против study_group.student_count';
COMMENT ON COLUMN room.is_online   IS 'TRUE — виртуальная (Zoom/Teams). Вместимость игнорируется.';
CREATE INDEX idx_room_building ON room(building_id);
CREATE INDEX idx_room_type     ON room(room_type);


CREATE TABLE calendar_day (
    calendar_date   DATE            PRIMARY KEY,
    day_of_week     SMALLINT        NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
    is_working      BOOLEAN         NOT NULL DEFAULT TRUE,
    day_type        VARCHAR(20)     NOT NULL
                        CHECK (day_type IN ('REGULAR','HOLIDAY','TRANSFERRED','SHORT')),
    week_number     SMALLINT        NOT NULL CHECK (week_number BETWEEN 1 AND 53),
    week_parity     VARCHAR(4)      NOT NULL CHECK (week_parity IN ('ODD','EVEN')),
    holiday_name    VARCHAR(100)                    -- заполняется только для праздников
);
COMMENT ON TABLE  calendar_day              IS '6-дневный производственный календарь. Праздники, переносы, чётность недель.';
COMMENT ON COLUMN calendar_day.day_of_week  IS '1=Пн, 2=Вт, 3=Ср, 4=Чт, 5=Пт, 6=Сб';
COMMENT ON COLUMN calendar_day.is_working   IS 'FALSE — занятия не ставятся (праздник или воскресенье)';
COMMENT ON COLUMN calendar_day.day_type     IS 'REGULAR=обычный, HOLIDAY=праздник, TRANSFERRED=перенесённый рабочий, SHORT=сокращённый';
COMMENT ON COLUMN calendar_day.week_parity  IS 'ODD=нечётная неделя, EVEN=чётная неделя';
CREATE INDEX idx_cd_working ON calendar_day(is_working, day_of_week);
CREATE INDEX idx_cd_week    ON calendar_day(week_number, week_parity);


CREATE TABLE schedule (
    schedule_id     SERIAL          PRIMARY KEY,
    schedule_name   VARCHAR(100)    NOT NULL,
    curriculum_id   INTEGER         NOT NULL
                        REFERENCES curriculum(curriculum_id) ON DELETE RESTRICT,
    academic_year   SMALLINT        NOT NULL,
    semester_number SMALLINT        NOT NULL CHECK (semester_number BETWEEN 1 AND 12),
    date_start      DATE            NOT NULL,
    date_end        DATE            NOT NULL,
    week_count      SMALLINT        NOT NULL CHECK (week_count >= 18),   -- ≥18 по ТЗ
    is_active       BOOLEAN         NOT NULL DEFAULT FALSE,
    copied_from_id  INTEGER         REFERENCES schedule(schedule_id),    -- NULL = оригинал
    created_at      TIMESTAMP       DEFAULT NOW(),
    CHECK (date_end > date_start)
);
COMMENT ON TABLE  schedule                IS 'Экземпляр расписания на один семестр. Можно копировать (copied_from_id).';
COMMENT ON COLUMN schedule.week_count     IS 'Количество учебных недель (не менее 18 по ТЗ)';
COMMENT ON COLUMN schedule.is_active      IS 'Только одно расписание должно быть активным одновременно';
COMMENT ON COLUMN schedule.copied_from_id IS 'Ссылка на исходное расписание при копировании';

-- Только одно активное расписание
CREATE UNIQUE INDEX idx_schedule_active ON schedule(is_active) WHERE is_active = TRUE;

CREATE TABLE lesson (
    lesson_id               SERIAL          PRIMARY KEY,
    schedule_id             INTEGER         NOT NULL
                                REFERENCES schedule(schedule_id)            ON DELETE CASCADE,
    study_group_id          INTEGER         NOT NULL
                                REFERENCES study_group(study_group_id)      ON DELETE RESTRICT,
    subj_id                 INTEGER         NOT NULL
                                REFERENCES curriculum_subject(subj_id)      ON DELETE RESTRICT,
    assignment_id           INTEGER         NOT NULL
                                REFERENCES teacher_assignment(assignment_id) ON DELETE RESTRICT,
    room_id                 INTEGER         NOT NULL
                                REFERENCES room(room_id)                    ON DELETE RESTRICT,
    slot_id                 SMALLINT        NOT NULL
                                REFERENCES slot(slot_id)                    ON DELETE RESTRICT,
    lesson_type             VARCHAR(12)     NOT NULL
                                CHECK (lesson_type IN
                                    ('LEC','PRAC','LAB','EXAM','CREDIT','CONSUL','PRACTICE')),
    -- Для еженедельных занятий:
    day_of_week             SMALLINT        CHECK (day_of_week BETWEEN 1 AND 6),
    week_parity             VARCHAR(4)      DEFAULT 'BOTH'
                                CHECK (week_parity IN ('ODD','EVEN','BOTH')),
    is_recurring            BOOLEAN         NOT NULL DEFAULT TRUE,
    -- Для разовых занятий (экзамен, зачёт, консультация):
    specific_date           DATE,
    -- Место проведения:
    location_type           VARCHAR(10)     NOT NULL DEFAULT 'ROOM'
                                CHECK (location_type IN ('ROOM','ONLINE')),
    -- Перенос:
    is_transfer             BOOLEAN         NOT NULL DEFAULT FALSE,
    created_at              TIMESTAMP       DEFAULT NOW(),

    -- Бизнес-правило: либо day_of_week+week_parity, либо specific_date
    CONSTRAINT chk_lesson_time CHECK (
        (is_recurring = TRUE  AND day_of_week IS NOT NULL AND specific_date IS NULL) OR
        (is_recurring = FALSE AND specific_date IS NOT NULL AND day_of_week IS NULL)
    )
);
COMMENT ON TABLE  lesson                          IS 'Центральная таблица расписания. Один элемент = одно занятие одной группы.';
COMMENT ON COLUMN lesson.day_of_week              IS '1=Пн … 6=Сб. NULL для разовых занятий (экзаменов, зачётов).';
COMMENT ON COLUMN lesson.week_parity              IS 'ODD=нечётная, EVEN=чётная, BOTH=каждую неделю';
COMMENT ON COLUMN lesson.is_recurring             IS 'TRUE=еженедельно, FALSE=разовое (с конкретной датой)';
COMMENT ON COLUMN lesson.specific_date            IS 'Конкретная дата для экзамена / зачёта / консультации';
COMMENT ON COLUMN lesson.location_type            IS 'ROOM=аудитория, ONLINE=дистанционно';
COMMENT ON COLUMN lesson.is_transfer              IS 'TRUE — это перенесённое занятие';

-- Индексы для быстрой проверки конфликтов (ограничения 1–4)
CREATE INDEX idx_lesson_group_time ON lesson
    (schedule_id, study_group_id, day_of_week, slot_id, week_parity);

CREATE INDEX idx_lesson_teacher_time ON lesson
    (schedule_id, assignment_id, day_of_week, slot_id, week_parity);

CREATE INDEX idx_lesson_room_time ON lesson
    (schedule_id, room_id, day_of_week, slot_id, week_parity);

CREATE INDEX idx_lesson_schedule ON lesson(schedule_id);
CREATE INDEX idx_lesson_date     ON lesson(specific_date) WHERE specific_date IS NOT NULL;


CREATE TABLE transfer (
    transfer_id         SERIAL          PRIMARY KEY,
    original_lesson_id  INTEGER         NOT NULL
                            REFERENCES lesson(lesson_id) ON DELETE CASCADE,
    original_date       DATE            NOT NULL,
    new_date            DATE            NOT NULL,
    new_slot_id         SMALLINT        NOT NULL
                            REFERENCES slot(slot_id),
    new_room_id         INTEGER         REFERENCES room(room_id),   -- NULL = та же аудитория
    reason              VARCHAR(200),
    status              VARCHAR(10)     NOT NULL DEFAULT 'PENDING'
                            CHECK (status IN ('PENDING','APPROVED','REJECTED')),
    created_at          TIMESTAMP       DEFAULT NOW()
    -- NOTE: проверка «перенос должен менять дату или пару» вынесена в триггер
    --       trg_transfer_meaningful (ниже) — PostgreSQL не допускает подзапросы в CHECK.
);
COMMENT ON TABLE  transfer         IS 'Переносы занятий. Статус проходит цикл: PENDING → APPROVED / REJECTED.';
COMMENT ON COLUMN transfer.status  IS 'PENDING=ожидает, APPROVED=подтверждён, REJECTED=отклонён';
CREATE INDEX idx_transfer_lesson ON transfer(original_lesson_id);
CREATE INDEX idx_transfer_status ON transfer(status);

-- Триггер вместо CHECK: перенос обязан реально что-то менять (дату или пару)
CREATE OR REPLACE FUNCTION trg_transfer_meaningful_fn()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_orig_slot_id SMALLINT;
BEGIN
    SELECT slot_id INTO v_orig_slot_id
    FROM lesson
    WHERE lesson_id = NEW.original_lesson_id;

    IF NEW.new_date = NEW.original_date AND NEW.new_slot_id = v_orig_slot_id THEN
        RAISE EXCEPTION
            'Перенос не имеет смысла: новая дата (%) и новый слот (%) совпадают с исходными.',
            NEW.new_date, NEW.new_slot_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_transfer_meaningful
    BEFORE INSERT OR UPDATE ON transfer
    FOR EACH ROW
    EXECUTE FUNCTION trg_transfer_meaningful_fn();

COMMENT ON TRIGGER trg_transfer_meaningful ON transfer IS
    'Запрещает «пустой» перенос: новая дата и новый слот не могут одновременно совпадать с исходными.';

CREATE TABLE teacher_preference (
    pref_id             SERIAL          PRIMARY KEY,
    teacher_id          INTEGER         NOT NULL
                            REFERENCES teacher(teacher_id) ON DELETE CASCADE,
    day_of_week         SMALLINT        CHECK (day_of_week BETWEEN 1 AND 6),
    slot_id             SMALLINT        REFERENCES slot(slot_id),
    preference_type     VARCHAR(6)      NOT NULL CHECK (preference_type IN ('PREFER','AVOID')),
    created_at          TIMESTAMP       DEFAULT NOW()
);
COMMENT ON TABLE  teacher_preference                   IS 'Предпочтения преподавателей по дням и парам. Учитываются не всегда.';
COMMENT ON COLUMN teacher_preference.preference_type   IS 'PREFER=предпочтительно, AVOID=нежелательно';
CREATE INDEX idx_pref_teacher ON teacher_preference(teacher_id);

-- ------------------------------------------------------------
-- SLOT — расписание звонков (6-дневка, 8 пар)
-- ------------------------------------------------------------
INSERT INTO slot (slot_id, slot_number, time_start, time_end) VALUES
    (1, 1, '08:30', '10:00'),
    (2, 2, '10:10', '11:40'),
    (3, 3, '11:50', '13:20'),
    (4, 4, '13:30', '15:00'),
    (5, 5, '15:10', '16:40'),
    (6, 6, '16:50', '18:20'),
    (7, 7, '18:30', '19:00'),
    (8, 8, '19:10', '20:40');

-- ------------------------------------------------------------
-- CALENDAR_DAY — фрагмент: осенний семестр 2024
-- 01.09.2024 – 31.12.2024 (6-дневка)
-- ------------------------------------------------------------
INSERT INTO calendar_day (calendar_date, day_of_week, is_working, day_type, week_number, week_parity)
SELECT
    d::DATE                                                     AS calendar_date,
    EXTRACT(DOW FROM d)::SMALLINT                               AS day_of_week,  -- PostgreSQL: 0=Вс, 1=Пн…6=Сб
    CASE WHEN EXTRACT(DOW FROM d) = 0 THEN FALSE ELSE TRUE END  AS is_working,   -- воскресенья — нерабочие
    'REGULAR'                                                   AS day_type,
    CEIL(
        (d::DATE - '2024-09-01'::DATE + 1.0) / 6
    )::SMALLINT                                                 AS week_number,
    CASE WHEN CEIL(
        (d::DATE - '2024-09-01'::DATE + 1.0) / 6
    )::INTEGER % 2 = 0 THEN 'EVEN' ELSE 'ODD' END              AS week_parity
FROM generate_series('2024-09-01'::DATE, '2024-12-31'::DATE, '1 day') d
WHERE EXTRACT(DOW FROM d) <> 0;  -- исключаем воскресенья

-- Государственные праздники осеннего семестра 2024
UPDATE calendar_day SET is_working = FALSE, day_type = 'HOLIDAY', holiday_name = 'День народного единства'
WHERE calendar_date = '2024-11-04';

-- Короткий день перед праздником (по ТК РФ, ч. 1 ст. 95)
UPDATE calendar_day SET day_type = 'SHORT'
WHERE calendar_date = '2024-11-03';

-- ------------------------------------------------------------
-- TRAINING_PROGRAM — примеры направлений
-- ------------------------------------------------------------
INSERT INTO training_program (program_name, degree_level, duration_years) VALUES
    ('Информационная безопасность',                           'BACHELOR',   4),
    ('Программная инженерия',                                 'BACHELOR',   4),
    ('Прикладная математика и информатика',                   'BACHELOR',   4),
    ('Управление в технических системах',                     'BACHELOR',   4),
    ('Информационные системы и технологии',                   'MASTER',     2);

-- ------------------------------------------------------------
-- SCHOOL + DEPARTMENT — структура подразделений
-- ------------------------------------------------------------
INSERT INTO school (school_name) VALUES
    ('Школа информационных технологий'),
    ('Школа математики и естественных наук');

INSERT INTO department (department_name, school_id) VALUES
    ('Кафедра информационной безопасности',       1),   -- id=1
    ('Кафедра программной инженерии',             1),   -- id=2
    ('Кафедра прикладной математики',             2),   -- id=3
    ('Кафедра физики',                            2);   -- id=4

-- Привязываем каждое направление к кафедре (иерархия: направление → кафедра → школа)
UPDATE training_program SET department_id = 1 WHERE program_id = 1;  -- ИБ        → Каф. ИБ
UPDATE training_program SET department_id = 2 WHERE program_id = 2;  -- ПИ        → Каф. ПИ
UPDATE training_program SET department_id = 3 WHERE program_id = 3;  -- ПМИ       → Каф. прикл. математики
UPDATE training_program SET department_id = 1 WHERE program_id = 4;  -- УТС       → Каф. ИБ
UPDATE training_program SET department_id = 2 WHERE program_id = 5;  -- ИСТ (маг) → Каф. ПИ

-- После заполнения делаем поле обязательным
ALTER TABLE training_program ALTER COLUMN department_id SET NOT NULL;

-- ------------------------------------------------------------
-- TEACHER — несколько преподавателей
-- ------------------------------------------------------------
INSERT INTO teacher (last_name, first_name, middle_name, department_id, academic_degree, academic_rank, position) VALUES
    ('Иванов',    'Алексей',  'Петрович',  1, 'канд. техн. наук', 'доцент',    'Доцент'),
    ('Петрова',   'Мария',    'Сергеевна', 1, NULL,                NULL,        'Старший преподаватель'),
    ('Сидоров',   'Дмитрий',  'Юрьевич',  2, 'д-р техн. наук',   'профессор', 'Профессор'),
    ('Козлова',   'Анна',     'Викторовна',3, 'канд. физ.-мат. наук','доцент', 'Доцент'),
    ('Новиков',   'Игорь',    'Андреевич', 2, NULL,                NULL,        'Ассистент');

-- ------------------------------------------------------------
-- SUBJECT — дисциплины
-- ------------------------------------------------------------
INSERT INTO subject (subject_name) VALUES
    ('Математический анализ'),
    ('Линейная алгебра'),
    ('Теория вероятностей и математическая статистика'),
    ('Программирование на Python'),
    ('Операционные системы'),
    ('Базы данных'),
    ('Сети и телекоммуникации'),
    ('Криптография'),
    ('Физическая культура и спорт');

-- ------------------------------------------------------------
-- CURRICULUM — учебный план для 1-го года, 1-го семестра
-- ------------------------------------------------------------
INSERT INTO curriculum (program_id, year_number, semester_number) VALUES
    (1, 1, 1),   -- ИБ, 1 курс, 1 семестр
    (1, 1, 2),
    (2, 1, 1),   -- ПИ, 1 курс, 1 семестр
    (3, 1, 1);   -- ПМИ, 1 курс, 1 семестр

-- ------------------------------------------------------------
-- CURRICULUM_SUBJECT — дисциплины в плане с часами
-- ------------------------------------------------------------
INSERT INTO curriculum_subject (curriculum_id, subject_id, lecture_hours, practice_hours, lab_hours, report_type, credit_units) VALUES
    (1, 1, 36, 18, 0,  'EXAM',   4.0),   -- Матанализ
    (1, 2, 18, 18, 0,  'CREDIT', 2.0),   -- Линейная алгебра
    (1, 4, 18,  0, 36, 'CREDIT', 3.0),   -- Python
    (1, 5, 18,  0, 36, 'EXAM',   3.0),   -- ОС
    (1, 9,  0, 72,  0, 'CREDIT', 2.0),   -- Физкультура
    (3, 1, 36, 18,  0, 'EXAM',   4.0),
    (3, 4, 18,  0, 36, 'CREDIT', 3.0),
    (4, 1, 36, 18,  0, 'EXAM',   4.0),
    (4, 2, 18, 18,  0, 'CREDIT', 2.0);

-- ------------------------------------------------------------
-- ACADEMIC_GROUP + STUDY_GROUP
-- ------------------------------------------------------------
INSERT INTO academic_group (group_name, program_id, year_of_enrollment) VALUES
    ('24-ИБ-1', 1, 2024),
    ('24-ИБ-2', 1, 2024),
    ('24-ПИ-1', 2, 2024),
    ('24-ПМИ-1',3, 2024);

-- Полные группы
INSERT INTO study_group (study_group_name, group_type, student_count, academic_group_id) VALUES
    ('24-ИБ-1',      'FULL',     25, 1),
    ('24-ИБ-2',      'FULL',     23, 2),
    ('24-ПИ-1',      'FULL',     27, 3),
    ('24-ПМИ-1',     'FULL',     20, 4);

-- Подгруппы (для лабораторных)
INSERT INTO study_group (study_group_name, group_type, student_count, academic_group_id) VALUES
    ('24-ИБ-1-А',   'SUBGROUP',  13, 1),
    ('24-ИБ-1-Б',   'SUBGROUP',  12, 1),
    ('24-ИБ-2-А',   'SUBGROUP',  12, 2),
    ('24-ИБ-2-Б',   'SUBGROUP',  11, 2);

-- Поток (лекции вместе)
INSERT INTO study_group (study_group_name, group_type, student_count, academic_group_id) VALUES
    ('24-ИБ-ПОТОК',  'STREAM',   48, 1);  -- 24-ИБ-1 + 24-ИБ-2 на лекции

-- Сборная (физкультура из разных групп)
INSERT INTO study_group (study_group_name, group_type, student_count, academic_group_id) VALUES
    ('24-ФИЗРА-1',   'MIXED',    20, 1);

-- ------------------------------------------------------------
-- BUILDING + ROOM
-- ------------------------------------------------------------
INSERT INTO building (building_name, address) VALUES
    ('Корпус А', 'ул. Университетская, 1'),
    ('Корпус Б', 'ул. Университетская, 3'),
    ('Корпус В', 'ул. Лабораторная, 5');

-- Расстояния между корпусами (в минутах)
INSERT INTO building_distance (from_building_id, to_building_id, travel_minutes) VALUES
    (1, 2,  5), (2, 1,  5),
    (1, 3, 12), (3, 1, 12),
    (2, 3,  8), (3, 2,  8);

INSERT INTO room (room_number, room_type, capacity, building_id, is_online) VALUES
    ('А-101', 'LECTURE',    120, 1, FALSE),
    ('А-201', 'SEMINAR',     30, 1, FALSE),
    ('А-202', 'SEMINAR',     30, 1, FALSE),
    ('А-301', 'COMPUTER',    25, 1, FALSE),
    ('Б-101', 'LECTURE',     80, 2, FALSE),
    ('Б-201', 'SEMINAR',     30, 2, FALSE),
    ('В-101', 'LABORATORY',  20, 3, FALSE),
    ('В-102', 'LABORATORY',  20, 3, FALSE),
    ('В-201', 'COMPUTER',    30, 3, FALSE),
    ('ONLINE','LECTURE',   9999, 1, TRUE );   -- виртуальная аудитория

-- ------------------------------------------------------------
-- TEACHER_ASSIGNMENT — учебные поручения
-- ------------------------------------------------------------
-- Иванов: Матанализ (лекции + практики) в курикулуме 1
INSERT INTO teacher_assignment (teacher_id, subj_id, lesson_types) VALUES
    (1, 1,  'LEC,PRAC,EXAM,CONSUL'),   -- Иванов — Матанализ (curriculum 1)
    (2, 2,  'PRAC,CREDIT'),            -- Петрова — Линейная алгебра (практики)
    (1, 2,  'LEC,EXAM'),               -- Иванов — Линейная алгебра (лекции)
    (3, 3,  'LEC,PRAC,LAB,CREDIT'),    -- Сидоров — Python
    (3, 4,  'LEC,LAB,EXAM'),           -- Сидоров — ОС
    (5, 5,  'PRAC,CREDIT');            -- Новиков — Физкультура

-- ------------------------------------------------------------
-- SCHEDULE — расписание осеннего семестра 2024
-- ------------------------------------------------------------
INSERT INTO schedule (schedule_name, curriculum_id, academic_year, semester_number,
                      date_start, date_end, week_count, is_active) VALUES
    ('Осень 2024 — ИБ 1 курс', 1, 2024, 1,
     '2024-09-02', '2024-12-28', 18, TRUE);

-- ------------------------------------------------------------
-- LESSON — несколько примеров занятий (расписание id=1)
-- ------------------------------------------------------------
-- Лекция по Матанализу (поток) каждую неделю, Пн 1 пара, аудитория А-101
INSERT INTO lesson (schedule_id, study_group_id, subj_id, assignment_id, room_id,
                    slot_id, lesson_type, day_of_week, week_parity, is_recurring) VALUES
    (1,  9, 1, 1, 1, 1, 'LEC', 1, 'BOTH', TRUE);   -- 24-ИБ-ПОТОК, Пн, пара 1

-- Практика Матанализа гр. 24-ИБ-1, Вт 2 пара, нечётные недели
INSERT INTO lesson (schedule_id, study_group_id, subj_id, assignment_id, room_id,
                    slot_id, lesson_type, day_of_week, week_parity, is_recurring) VALUES
    (1, 1, 1, 1, 2, 2, 'PRAC', 2, 'ODD', TRUE);

-- Практика Матанализа гр. 24-ИБ-2, Вт 2 пара, чётные недели
INSERT INTO lesson (schedule_id, study_group_id, subj_id, assignment_id, room_id,
                    slot_id, lesson_type, day_of_week, week_parity, is_recurring) VALUES
    (1, 2, 1, 1, 6, 2, 'PRAC', 2, 'EVEN', TRUE);

-- Лаборатория Python, подгруппа А, Ср 3 пара, комп. класс
INSERT INTO lesson (schedule_id, study_group_id, subj_id, assignment_id, room_id,
                    slot_id, lesson_type, day_of_week, week_parity, is_recurring) VALUES
    (1, 5, 3, 3, 4, 3, 'LAB', 3, 'ODD',  TRUE),  -- 24-ИБ-1-А
    (1, 6, 3, 3, 9, 3, 'LAB', 3, 'EVEN', TRUE);  -- 24-ИБ-1-Б

-- Экзамен по Матанализу — разовое занятие 25.12.2024, пара 2, аудитория А-101
INSERT INTO lesson (schedule_id, study_group_id, subj_id, assignment_id, room_id,
                    slot_id, lesson_type, is_recurring, specific_date, day_of_week, week_parity) VALUES
    (1, 9, 1, 1, 1, 2, 'EXAM', FALSE, '2024-12-25', NULL, NULL);

-- Консультация перед экзаменом — 24.12.2024, пара 4, аудитория А-201
INSERT INTO lesson (schedule_id, study_group_id, subj_id, assignment_id, room_id,
                    slot_id, lesson_type, is_recurring, specific_date, day_of_week, week_parity) VALUES
    (1, 9, 1, 1, 2, 4, 'CONSUL', FALSE, '2024-12-24', NULL, NULL);

-- Физкультура, сборная, Пт 5 пара, каждую неделю
INSERT INTO lesson (schedule_id, study_group_id, subj_id, assignment_id, room_id,
                    slot_id, lesson_type, day_of_week, week_parity, is_recurring) VALUES
    (1, 10, 5, 6, 5, 5, 'PRAC', 5, 'BOTH', TRUE);

-- TEACHER_PREFERENCE — Иванов не хочет первую пару
INSERT INTO teacher_preference (teacher_id, day_of_week, slot_id, preference_type) VALUES
    (1, 1, 1, 'AVOID'),   -- Понедельник, 1 пара — нежелательно
    (1, 3, 3, 'PREFER');  -- Среда, 3 пара — предпочтительно

-- ============================================================
--  VIEWS — удобные представления для отчётов
-- ============================================================

-- Иерархия: направление → кафедра → школа
CREATE OR REPLACE VIEW v_program_hierarchy AS
SELECT
    tp.program_id,
    tp.program_name,
    tp.degree_level,
    tp.duration_years,
    d.department_id,
    d.department_name,
    sc.school_id,
    sc.school_name
FROM training_program tp
JOIN department d  ON d.department_id = tp.department_id
JOIN school     sc ON sc.school_id    = d.school_id
ORDER BY sc.school_name, d.department_name, tp.program_name;

COMMENT ON VIEW v_program_hierarchy IS
    'Иерархия: направление → кафедра → школа. '
    'JOIN по academic_group.program_id даёт студенту его кафедру и школу.';

-- Полное расписание: группа, день, пара, предмет, преподаватель, аудитория
CREATE OR REPLACE VIEW v_schedule_full AS
SELECT
    s.schedule_name,
    sg.study_group_name                                          AS group_name,
    sg.group_type,
    CASE l.day_of_week
        WHEN 1 THEN 'Понедельник' WHEN 2 THEN 'Вторник'
        WHEN 3 THEN 'Среда'       WHEN 4 THEN 'Четверг'
        WHEN 5 THEN 'Пятница'     WHEN 6 THEN 'Суббота'
    END                                                          AS day_name,
    l.day_of_week,
    sl.slot_number                                               AS pair_number,
    sl.time_start,
    sl.time_end,
    l.week_parity,
    sub.subject_name,
    l.lesson_type,
    t.last_name || ' ' || LEFT(t.first_name,1) || '.'
        || COALESCE(' ' || LEFT(t.middle_name,1) || '.', '')     AS teacher_short,
    t.last_name || ' ' || t.first_name || ' ' || COALESCE(t.middle_name,'') AS teacher_full,
    t.academic_degree,
    t.academic_rank,
    t.position                                                   AS teacher_position,
    r.room_number,
    b.building_name,
    r.room_type,
    r.capacity,
    sg.student_count,
    l.location_type,
    l.specific_date,
    l.is_recurring
FROM lesson          l
JOIN schedule        s   ON s.schedule_id    = l.schedule_id
JOIN study_group     sg  ON sg.study_group_id = l.study_group_id
JOIN curriculum_subject cs ON cs.subj_id     = l.subj_id
JOIN subject         sub ON sub.subject_id   = cs.subject_id
JOIN teacher_assignment ta ON ta.assignment_id = l.assignment_id
JOIN teacher         t   ON t.teacher_id     = ta.teacher_id
JOIN room            r   ON r.room_id        = l.room_id
JOIN building        b   ON b.building_id    = r.building_id
JOIN slot            sl  ON sl.slot_id       = l.slot_id
ORDER BY l.day_of_week, sl.slot_number, sg.study_group_name;

COMMENT ON VIEW v_schedule_full IS 'Полное расписание: группа, день, пара, предмет, преподаватель, аудитория';

-- Расписание экзаменов, зачётов и консультаций
CREATE OR REPLACE VIEW v_exam_schedule AS
SELECT
    s.schedule_name,
    sg.study_group_name                 AS group_name,
    sub.subject_name,
    l.lesson_type,
    l.specific_date,
    TO_CHAR(l.specific_date, 'Day')     AS weekday,
    sl.slot_number                      AS pair_number,
    sl.time_start,
    sl.time_end,
    t.last_name || ' ' || LEFT(t.first_name,1) || '.' || COALESCE(' ' || LEFT(t.middle_name,1) || '.','') AS teacher_short,
    r.room_number,
    b.building_name
FROM lesson          l
JOIN schedule        s   ON s.schedule_id    = l.schedule_id
JOIN study_group     sg  ON sg.study_group_id = l.study_group_id
JOIN curriculum_subject cs ON cs.subj_id     = l.subj_id
JOIN subject         sub ON sub.subject_id   = cs.subject_id
JOIN teacher_assignment ta ON ta.assignment_id = l.assignment_id
JOIN teacher         t   ON t.teacher_id     = ta.teacher_id
JOIN room            r   ON r.room_id        = l.room_id
JOIN building        b   ON b.building_id    = r.building_id
JOIN slot            sl  ON sl.slot_id       = l.slot_id
WHERE l.lesson_type IN ('EXAM','CREDIT','CONSUL')
ORDER BY l.specific_date, sl.slot_number;

COMMENT ON VIEW v_exam_schedule IS 'Расписание экзаменов, зачётов и консультаций с конкретными датами';

-- Загрузка преподавателей (кол-во пар в неделю по каждому типу)
CREATE OR REPLACE VIEW v_teacher_load AS
SELECT
    t.teacher_id,
    t.last_name || ' ' || t.first_name  AS teacher_name,
    t.academic_degree,
    t.academic_rank,
    t.position,
    d.department_name,
    sc.school_name,
    sub.subject_name,
    l.lesson_type,
    COUNT(*)                             AS lesson_count_total,
    COUNT(*) FILTER (WHERE l.week_parity = 'BOTH')  AS weekly_both,
    COUNT(*) FILTER (WHERE l.week_parity = 'ODD')   AS weekly_odd,
    COUNT(*) FILTER (WHERE l.week_parity = 'EVEN')  AS weekly_even
FROM lesson          l
JOIN teacher_assignment ta ON ta.assignment_id = l.assignment_id
JOIN teacher         t   ON t.teacher_id       = ta.teacher_id
JOIN department      d   ON d.department_id    = t.department_id
JOIN school          sc  ON sc.school_id       = d.school_id
JOIN curriculum_subject cs ON cs.subj_id       = l.subj_id
JOIN subject         sub ON sub.subject_id     = cs.subject_id
WHERE l.is_recurring = TRUE
GROUP BY t.teacher_id, t.last_name, t.first_name, t.academic_degree,
         t.academic_rank, t.position, d.department_name, sc.school_name,
         sub.subject_name, l.lesson_type
ORDER BY t.last_name, sub.subject_name, l.lesson_type;

COMMENT ON VIEW v_teacher_load IS 'Загрузка преподавателей: количество пар по видам занятий';

-- Загрузка помещений
CREATE OR REPLACE VIEW v_room_load AS
SELECT
    b.building_name,
    r.room_number,
    r.room_type,
    r.capacity,
    CASE l.day_of_week
        WHEN 1 THEN 'Пн' WHEN 2 THEN 'Вт' WHEN 3 THEN 'Ср'
        WHEN 4 THEN 'Чт' WHEN 5 THEN 'Пт' WHEN 6 THEN 'Сб'
    END                                     AS day_short,
    l.day_of_week,
    sl.slot_number,
    sl.time_start,
    l.week_parity,
    sg.study_group_name,
    sub.subject_name,
    l.lesson_type
FROM lesson         l
JOIN room           r  ON r.room_id        = l.room_id
JOIN building       b  ON b.building_id    = r.building_id
JOIN slot           sl ON sl.slot_id       = l.slot_id
JOIN study_group    sg ON sg.study_group_id = l.study_group_id
JOIN curriculum_subject cs ON cs.subj_id   = l.subj_id
JOIN subject        sub ON sub.subject_id  = cs.subject_id
WHERE l.is_recurring = TRUE
ORDER BY b.building_name, r.room_number, l.day_of_week, sl.slot_number, l.week_parity;

COMMENT ON VIEW v_room_load IS 'Загрузка учебных помещений по дням, парам и неделям';

-- ============================================================
--  FUNCTIONS — проверка ограничений перед вставкой занятия
-- ============================================================

-- Функция: возвращает список конфликтов для нового занятия
CREATE OR REPLACE FUNCTION check_lesson_conflicts(
    p_schedule_id       INTEGER,
    p_study_group_id    INTEGER,
    p_assignment_id     INTEGER,
    p_room_id           INTEGER,
    p_slot_id           SMALLINT,
    p_day_of_week       SMALLINT,       -- NULL для разовых
    p_week_parity       VARCHAR(4),     -- 'ODD','EVEN','BOTH'
    p_is_recurring      BOOLEAN,
    p_specific_date     DATE,           -- NULL для еженедельных
    p_lesson_type       VARCHAR(12),
    p_exclude_lesson_id INTEGER DEFAULT NULL  -- для UPDATE
)
RETURNS TABLE (conflict_code VARCHAR(20), conflict_message TEXT)
LANGUAGE plpgsql AS $$
DECLARE
    v_student_count SMALLINT;
    v_room_capacity SMALLINT;
    v_room_type     VARCHAR(20);
    v_room_is_online BOOLEAN;
    v_teacher_pairs_day SMALLINT;
    v_group_pairs_day   SMALLINT;
    v_prev_room_id  INTEGER;
    v_prev_building INTEGER;
    v_curr_building INTEGER;
    v_travel_min    SMALLINT;
    v_break_min     SMALLINT;
    -- перекрытие по времени (для еженедельных)
    v_week_overlap  TEXT := CASE
        WHEN p_week_parity = 'BOTH' THEN 'ODD,EVEN,BOTH'
        WHEN p_week_parity = 'ODD'  THEN 'ODD,BOTH'
        WHEN p_week_parity = 'EVEN' THEN 'EVEN,BOTH'
    END;
BEGIN
    -- ── 1. Конфликт группы ──────────────────────────────────
    IF p_is_recurring THEN
        IF EXISTS (
            SELECT 1 FROM lesson
            WHERE schedule_id    = p_schedule_id
              AND study_group_id = p_study_group_id
              AND day_of_week    = p_day_of_week
              AND slot_id        = p_slot_id
              AND week_parity    = ANY(string_to_array(v_week_overlap, ','))
              AND is_recurring   = TRUE
              AND (p_exclude_lesson_id IS NULL OR lesson_id <> p_exclude_lesson_id)
        ) THEN
            RETURN QUERY SELECT 'GROUP_CONFLICT'::VARCHAR(20),
                'Группа уже занята в это время'::TEXT;
        END IF;
    ELSE
        IF EXISTS (
            SELECT 1 FROM lesson
            WHERE schedule_id    = p_schedule_id
              AND study_group_id = p_study_group_id
              AND is_recurring   = FALSE
              AND specific_date  = p_specific_date
              AND slot_id        = p_slot_id
              AND (p_exclude_lesson_id IS NULL OR lesson_id <> p_exclude_lesson_id)
        ) THEN
            RETURN QUERY SELECT 'GROUP_CONFLICT'::VARCHAR(20),
                'Группа уже занята в это время (разовое занятие)'::TEXT;
        END IF;
    END IF;

    -- ── 2. Конфликт преподавателя ───────────────────────────
    IF p_is_recurring THEN
        IF EXISTS (
            SELECT 1 FROM lesson
            WHERE schedule_id   = p_schedule_id
              AND assignment_id = p_assignment_id
              AND day_of_week   = p_day_of_week
              AND slot_id       = p_slot_id
              AND week_parity   = ANY(string_to_array(v_week_overlap, ','))
              AND is_recurring  = TRUE
              AND (p_exclude_lesson_id IS NULL OR lesson_id <> p_exclude_lesson_id)
        ) THEN
            RETURN QUERY SELECT 'TEACHER_CONFLICT'::VARCHAR(20),
                'Преподаватель уже ведёт занятие в это время'::TEXT;
        END IF;
    END IF;

    -- ── 3. Конфликт помещения ───────────────────────────────
    IF p_is_recurring THEN
        IF EXISTS (
            SELECT 1 FROM lesson
            WHERE schedule_id  = p_schedule_id
              AND room_id      = p_room_id
              AND day_of_week  = p_day_of_week
              AND slot_id      = p_slot_id
              AND week_parity  = ANY(string_to_array(v_week_overlap, ','))
              AND is_recurring = TRUE
              AND (p_exclude_lesson_id IS NULL OR lesson_id <> p_exclude_lesson_id)
        ) THEN
            RETURN QUERY SELECT 'ROOM_CONFLICT'::VARCHAR(20),
                'Помещение уже занято в это время'::TEXT;
        END IF;
    END IF;

    -- ── 4. Вместимость помещения ────────────────────────────
    SELECT sg.student_count, r.capacity, r.room_type, r.is_online
    INTO   v_student_count, v_room_capacity, v_room_type, v_room_is_online
    FROM   study_group sg, room r
    WHERE  sg.study_group_id = p_study_group_id
      AND  r.room_id         = p_room_id;

    IF NOT v_room_is_online AND v_student_count > v_room_capacity THEN
        RETURN QUERY SELECT 'CAPACITY_EXCEEDED'::VARCHAR(20),
            format('Вместимость аудитории %s мест, в группе %s чел.',
                   v_room_capacity, v_student_count)::TEXT;
    END IF;

    -- ── 5. Тип помещения для лабораторных ──────────────────
    IF p_lesson_type = 'LAB' AND v_room_type NOT IN ('LABORATORY','COMPUTER') THEN
        RETURN QUERY SELECT 'WRONG_ROOM_TYPE'::VARCHAR(20),
            format('Лабораторная работа требует тип LABORATORY или COMPUTER, а не %s',
                   v_room_type)::TEXT;
    END IF;

    -- ── 6–7. Лимит 5 пар в день ─────────────────────────────
    IF p_is_recurring AND p_day_of_week IS NOT NULL THEN
        SELECT COUNT(*) INTO v_group_pairs_day
        FROM lesson
        WHERE schedule_id    = p_schedule_id
          AND study_group_id = p_study_group_id
          AND day_of_week    = p_day_of_week
          AND is_recurring   = TRUE
          AND (p_exclude_lesson_id IS NULL OR lesson_id <> p_exclude_lesson_id);

        IF v_group_pairs_day >= 5 THEN
            RETURN QUERY SELECT 'GROUP_DAY_LIMIT'::VARCHAR(20),
                'Для группы превышен лимит 5 пар в день'::TEXT;
        END IF;

        SELECT COUNT(*) INTO v_teacher_pairs_day
        FROM lesson
        WHERE schedule_id   = p_schedule_id
          AND assignment_id = p_assignment_id
          AND day_of_week   = p_day_of_week
          AND is_recurring  = TRUE
          AND (p_exclude_lesson_id IS NULL OR lesson_id <> p_exclude_lesson_id);

        IF v_teacher_pairs_day >= 5 THEN
            RETURN QUERY SELECT 'TEACHER_DAY_LIMIT'::VARCHAR(20),
                'Для преподавателя превышен лимит 5 пар в день'::TEXT;
        END IF;
    END IF;

    -- ── 8. Время перемещения между корпусами ────────────────
    IF p_is_recurring AND p_slot_id > 1 THEN
        -- Ищем предыдущую пару группы в тот же день
        SELECT l.room_id INTO v_prev_room_id
        FROM lesson l
        WHERE l.schedule_id    = p_schedule_id
          AND l.study_group_id = p_study_group_id
          AND l.day_of_week    = p_day_of_week
          AND l.slot_id        = p_slot_id - 1
          AND l.is_recurring   = TRUE
        LIMIT 1;

        IF v_prev_room_id IS NOT NULL THEN
            SELECT r.building_id INTO v_prev_building FROM room r WHERE r.room_id = v_prev_room_id;
            SELECT r.building_id INTO v_curr_building FROM room r WHERE r.room_id = p_room_id;

            IF v_prev_building IS DISTINCT FROM v_curr_building THEN
                SELECT bd.travel_minutes INTO v_travel_min
                FROM building_distance bd
                WHERE bd.from_building_id = v_prev_building
                  AND bd.to_building_id   = v_curr_building;

                -- Перерыв между p_slot_id-1 и p_slot_id
                SELECT EXTRACT(EPOCH FROM (s2.time_start - s1.time_end)) / 60
                INTO   v_break_min
                FROM slot s1, slot s2
                WHERE s1.slot_id = p_slot_id - 1
                  AND s2.slot_id = p_slot_id;

                IF v_travel_min > v_break_min THEN
                    RETURN QUERY SELECT 'TRAVEL_TIME'::VARCHAR(20),
                        format('Недостаточно времени на переход между корпусами: нужно %s мин, перерыв %s мин',
                               v_travel_min, v_break_min)::TEXT;
                END IF;
            END IF;
        END IF;
    END IF;

    -- ── 9. Нерабочий день ────────────────────────────────────
    IF NOT p_is_recurring AND p_specific_date IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM calendar_day
            WHERE calendar_date = p_specific_date AND is_working = FALSE
        ) THEN
            RETURN QUERY SELECT 'NON_WORKING_DAY'::VARCHAR(20),
                format('Дата %s является нерабочим днём', p_specific_date)::TEXT;
        END IF;
    END IF;

END;
$$;

COMMENT ON FUNCTION check_lesson_conflicts IS
    'Проверяет все ограничения ТЗ перед добавлением/обновлением занятия. '
    'Возвращает строки с кодом и текстом каждого конфликта.';

-- ============================================================
--  TRIGGER — автоматическая проверка при INSERT/UPDATE LESSON
-- ============================================================

CREATE OR REPLACE FUNCTION trg_lesson_conflict_check()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_conflict RECORD;
    v_messages TEXT := '';
BEGIN
    FOR v_conflict IN
        SELECT * FROM check_lesson_conflicts(
            NEW.schedule_id,
            NEW.study_group_id,
            NEW.assignment_id,
            NEW.room_id,
            NEW.slot_id,
            NEW.day_of_week,
            NEW.week_parity,
            NEW.is_recurring,
            NEW.specific_date,
            NEW.lesson_type,
            CASE WHEN TG_OP = 'UPDATE' THEN OLD.lesson_id ELSE NULL END
        )
    LOOP
        v_messages := v_messages || v_conflict.conflict_message || '; ';
    END LOOP;

    IF v_messages <> '' THEN
        RAISE EXCEPTION 'Конфликт расписания: %', v_messages;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lesson_before_insert_update
    BEFORE INSERT OR UPDATE ON lesson
    FOR EACH ROW
    EXECUTE FUNCTION trg_lesson_conflict_check();

COMMENT ON TRIGGER trg_lesson_before_insert_update ON lesson IS
    'Автоматически вызывает check_lesson_conflicts() перед каждой вставкой или изменением занятия';

-- ============================================================
--  ИТОГОВАЯ ПРОВЕРКА — полезные запросы
-- ============================================================

-- Пример: расписание группы 24-ИБ-ПОТОК
-- SELECT * FROM v_schedule_full WHERE group_name = '24-ИБ-ПОТОК';

-- Пример: расписание экзаменов
-- SELECT * FROM v_exam_schedule ORDER BY specific_date;

-- Пример: проверить конфликты перед добавлением занятия
-- SELECT * FROM check_lesson_conflicts(
--     1, 1, 1, 2, 2, 2, 'BOTH', TRUE, NULL, 'PRAC'
-- );

-- Пример: загрузка помещений корпуса А
-- SELECT * FROM v_room_load WHERE building_name = 'Корпус А';