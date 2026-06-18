const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const lesson = await prisma.lesson.create({
            data: {
              schedule_id: 5,
              study_group_id: 34,
              subj_id: 60,
              assignment_id: 60,
              room_id: 82,
              lesson_type: 'LEC',
              day_of_week: 3,
              slot_id: 1,
              is_recurring: true,
              week_parity: "BOTH"
            }
          });
        console.log("SUCCESS:", lesson);
    } catch(e) {
        console.error("ERROR:", e);
    }
}
main().finally(() => prisma.$disconnect());
