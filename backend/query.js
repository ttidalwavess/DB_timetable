const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const slots = await prisma.slot.findMany();
    console.log("SLOTS:", slots);
}
main().catch(console.error).finally(() => prisma.$disconnect());
