import { prisma } from "../../../config/prisma.js";

export const technicianService = {
  getTechnicianMetrics: async (tenantId: string, startDate: Date, endDate: Date) => {
    // 1. Fetch all technicians for this tenant
    const technicians = await prisma.user.findMany({
      where: {
        tenantId,
        role: "TECHNICIAN",
      },
      select: {
        id: true,
        name: true,
      },
    });

    // 2. Query completed/assigned tickets in date range for all technicians
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        assignedToId: { in: technicians.map(t => t.id) },
      },
      select: {
        id: true,
        assignedToId: true,
        status: true,
        laborCost: true,
        partsCost: true,
        totalAmount: true,
        createdAt: true,
        actualCompletionDate: true,
      },
    });

    const technicianMetrics = technicians.map((tech) => {
      // Tickets assigned in range (based on ticket.createdAt)
      const techAssignedTickets = tickets.filter(
        t => t.assignedToId === tech.id && t.createdAt >= startDate && t.createdAt <= endDate
      );
      
      // Tickets completed in range (based on actualCompletionDate)
      const techCompletedTickets = tickets.filter(
        t => t.assignedToId === tech.id && 
             t.status === "COMPLETED" && 
             t.actualCompletionDate && 
             t.actualCompletionDate >= startDate && 
             t.actualCompletionDate <= endDate
      );

      // Pending tickets assigned to them currently (as of today)
      const pendingTickets = tickets.filter(
        t => t.assignedToId === tech.id && 
             t.status !== "COMPLETED" && 
             t.status !== "CANCELLED"
      );

      // Average completion time in days
      let totalHrs = 0;
      techCompletedTickets.forEach((t) => {
        if (t.actualCompletionDate) {
          totalHrs += (t.actualCompletionDate.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
        }
      });
      const avgCompletionTime = techCompletedTickets.length > 0
        ? parseFloat(((totalHrs / techCompletedTickets.length) / 24).toFixed(1))
        : 0;

      // Revenue generated (labor/service revenue vs parts cost/revenue)
      // Service revenue is laborCost on completed tickets.
      // Parts cost is partsCost on completed tickets.
      const serviceRevenue = techCompletedTickets.reduce((sum, t) => sum + Number(t.laborCost || 0), 0);
      const partsValue = techCompletedTickets.reduce((sum, t) => sum + Number(t.partsCost || 0), 0);
      const totalValue = techCompletedTickets.reduce((sum, t) => sum + Number(t.totalAmount || 0), 0);

      return {
        id: tech.id,
        name: tech.name,
        assigned: techAssignedTickets.length,
        completed: techCompletedTickets.length,
        avgCompletionTime,
        pending: pendingTickets.length,
        serviceRevenue,
        partsValue,
        totalValue,
      };
    });

    return technicianMetrics;
  },
};
