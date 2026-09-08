import { prisma } from "../config/prisma.js";

async function main() {
  console.log('Migrating COMPLETED status to DELIVERED...');
  
  const updatedTickets = await prisma.ticket.updateMany({
    where: { status: 'COMPLETED' as any },
    data: { status: 'DELIVERED' as any },
  });
  console.log(`Updated ${updatedTickets.count} ticket(s) from COMPLETED to DELIVERED.`);

  const updatedHistory = await prisma.ticketStatusHistory.updateMany({
    where: { status: 'COMPLETED' as any },
    data: { status: 'DELIVERED' as any },
  });
  console.log(`Updated ${updatedHistory.count} status history record(s) from COMPLETED to DELIVERED.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
