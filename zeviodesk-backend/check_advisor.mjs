// Test script: simulate what the advisor endpoint sees
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';

async function main() {
  // Find the advisor user
  const advisor = await prisma.user.findFirst({ 
    where: { role: 'ADVISOR' },
    include: { tenant: true }
  });
  
  if (!advisor) {
    console.log('No advisor found!');
    return;
  }
  
  console.log('Advisor:', JSON.stringify({
    id: advisor.id,
    name: advisor.name,
    email: advisor.email,
    role: advisor.role,
    tenantId: advisor.tenantId,
    status: advisor.status,
    tenantStatus: advisor.tenant?.status
  }, null, 2));

  // Simulate the service logic for ADVISOR
  const role = advisor.role; // "ADVISOR"
  const tenantId = advisor.tenantId;
  const statusIn = ['RECEIVED', 'DIAGNOSING', 'WAITING_FOR_PARTS', 'IN_PROGRESS', 'READY_FOR_PICKUP'];
  
  let allowedStatuses;
  if (role === "TECHNICIAN") {
    allowedStatuses = ["RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "IN_PROGRESS"];
  } else if (role === "ADVISOR") {
    allowedStatuses = ["RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "IN_PROGRESS", "READY_FOR_PICKUP"];
  } else if (role === "TENANT_ADMIN" || role === "MANAGER") {
    allowedStatuses = ["RECEIVED", "DIAGNOSING", "WAITING_FOR_PARTS", "IN_PROGRESS", "READY_FOR_PICKUP"];
  }
  
  let resolvedStatusIn = statusIn;
  if (allowedStatuses) {
    if (resolvedStatusIn && resolvedStatusIn.length > 0) {
      resolvedStatusIn = resolvedStatusIn.filter(s => allowedStatuses.includes(s));
      if (resolvedStatusIn.length === 0) {
        console.log('BUG: resolvedStatusIn is empty after filtering!');
        console.log('statusIn was:', statusIn);
        console.log('allowedStatuses was:', allowedStatuses);
        return;
      }
    } else {
      resolvedStatusIn = allowedStatuses;
    }
  }
  
  console.log('\nService simulation:');
  console.log('  role:', role);
  console.log('  tenantId:', tenantId);
  console.log('  resolvedStatusIn:', resolvedStatusIn);
  
  const where = {};
  if (tenantId) where.tenantId = tenantId;
  where.status = { in: resolvedStatusIn };
  
  console.log('\nRepository WHERE:', JSON.stringify(where, null, 2));
  
  const [data, total] = await Promise.all([
    prisma.ticket.findMany({ where, skip: 0, take: 10, orderBy: { createdAt: 'desc' } }),
    prisma.ticket.count({ where })
  ]);
  
  console.log('\nResult: total =', total, ', data count =', data.length);
  if (data.length > 0) {
    console.log('First ticket:', JSON.stringify(data[0], null, 2));
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
