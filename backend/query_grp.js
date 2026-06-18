const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const lessons = await prisma.lesson.findMany({
        where: { study_group_id: 49 }
    });
    console.log("Lessons for gr-111-1:", lessons);
}
main().finally(() => prisma.$disconnect());
