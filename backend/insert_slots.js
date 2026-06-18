const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const slotsData = [
    { slot_id: 5, slot_number: 5, time_start: new Date('1970-01-01T15:10:00Z'), time_end: new Date('1970-01-01T16:40:00Z') },
    { slot_id: 6, slot_number: 6, time_start: new Date('1970-01-01T16:50:00Z'), time_end: new Date('1970-01-01T18:20:00Z') },
    { slot_id: 7, slot_number: 7, time_start: new Date('1970-01-01T18:30:00Z'), time_end: new Date('1970-01-01T20:00:00Z') },
  ];
  
  for (const slot of slotsData) {
    await prisma.slot.upsert({
      where: { slot_number: slot.slot_number },
      update: {},
      create: slot,
    });
  }
  console.log('Slots 5, 6, 7 inserted successfully!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
