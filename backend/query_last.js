const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log(await prisma.lesson.findMany({orderBy: {lesson_id: 'desc'}, take: 1}));
}
main().finally(() => prisma.$disconnect());
