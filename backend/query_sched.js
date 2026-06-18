const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log(await prisma.schedule.findMany());
}
main().finally(() => prisma.$disconnect());
