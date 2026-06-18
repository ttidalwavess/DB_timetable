const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const group = await prisma.study_group.findFirst({
        where: { study_group_name: 'ГР-111-1' }
    });
    console.log("Group ГР-111-1:", group);
}
main().finally(() => prisma.$disconnect());
