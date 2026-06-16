/**
 * Возвращает:
 *  - fieldHints: { [fieldName]: { level, message } } — подсказки у полей
 *  - conflicts:  массив { code, text } из api.checkConflicts (debounced)
 *  - isChecking: идёт ли сейчас debounced-запрос
 *  - hasBlockingErrors: можно ли сабмитить форму
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import { runLocalValidation } from "../utils/lessonValidation";

const DEBOUNCE_MS = 350;

export function useLessonValidation(lesson, context, enabled = true) {
  const [serverConflicts, setServerConflicts] = useState([]);
  const [isChecking, setIsChecking] = useState(false);
  const timerRef = useRef(null);

  //Локальные правила 
  const local = useMemo(() => {
    if (!enabled) return { results: [], byField: {}, errors: [], warnings: [], hasErrors: false };
    return runLocalValidation(lesson, context);
  }, [
    enabled,
    lesson.lesson_type, lesson.room_id, lesson.study_group_id,
    lesson.assignment_id, lesson.day_of_week, lesson.slot_id,
    lesson.week_parity, lesson.is_recurring, lesson.lesson_id,
    context.rooms, context.studyGroups, context.lessons,
    context.buildingDistances, context.teacherAssignments,
  ]);

  //Серверная проверка пересечений 
  const isReadyForServerCheck =
    enabled &&
    lesson.room_id && lesson.study_group_id && lesson.slot_id &&
    (lesson.is_recurring ? lesson.day_of_week : lesson.specific_date);

  useEffect(() => {
    if (!isReadyForServerCheck) {
      setServerConflicts([]);
      return;
    }

    setIsChecking(true);
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      try {
        const conflicts = await api.checkConflicts(lesson);
        setServerConflicts(conflicts);
      } finally {
        setIsChecking(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timerRef.current);
  }, [
    isReadyForServerCheck,
    lesson.lesson_id, lesson.room_id, lesson.study_group_id, lesson.assignment_id,
    lesson.slot_id, lesson.day_of_week, lesson.week_parity,
    lesson.is_recurring, lesson.specific_date, lesson.lesson_type,
  ]);

  const allConflicts = [
    ...local.errors.map(e => ({ code: e.field, text: e.message, level: "error" })),
    ...serverConflicts.map(c => ({ code: c.code, text: c.text, level: "error" })),
  ];

  const hasBlockingErrors = local.hasErrors || serverConflicts.length > 0;

  return {
    fieldHints: local.byField,
    localWarnings: local.warnings,
    conflicts: allConflicts,
    isChecking,
    hasBlockingErrors,
  };
}
