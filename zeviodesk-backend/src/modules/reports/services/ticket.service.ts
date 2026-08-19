import { prisma } from "../../../config/prisma.js";

export const ticketService = {
  getTicketMetrics: async (tenantId: string, startDate: Date, endDate: Date) => {
    // 1. Fetch tickets created in selected date range
    const tickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        status: true,
        priority: true,
        itemCategory: true,
        brand: true,
        assignedTo: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        actualCompletionDate: true,
      },
    });

    const totalTickets = tickets.length;

    // 2. Status breakdown (all statuses from TicketStatus enum)
    const statusMap: Record<string, number> = {
      RECEIVED: 0,
      DIAGNOSING: 0,
      WAITING_FOR_PARTS: 0,
      IN_PROGRESS: 0,
      READY_FOR_PICKUP: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };
    tickets.forEach(t => {
      statusMap[t.status] = (statusMap[t.status] || 0) + 1;
    });

    const statusBreakdown = Object.keys(statusMap).map(status => ({
      name: status,
      value: statusMap[status],
    }));

    // 3. Priority breakdown
    const priorityMap: Record<string, number> = {};
    tickets.forEach(t => {
      const prio = t.priority || "NORMAL";
      priorityMap[prio] = (priorityMap[prio] || 0) + 1;
    });
    const ticketsByPriority = Object.keys(priorityMap).map(prio => ({
      name: prio,
      value: priorityMap[prio],
    }));

    // 4. Category breakdown
    const categoryMap: Record<string, number> = {};
    tickets.forEach(t => {
      const cat = t.itemCategory || "Other";
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });
    const ticketsByCategory = Object.keys(categoryMap).map(cat => ({
      name: cat,
      value: categoryMap[cat],
    }));

    // 5. Brand breakdown
    const brandMap: Record<string, number> = {};
    tickets.forEach(t => {
      const brand = t.brand || "Other";
      brandMap[brand] = (brandMap[brand] || 0) + 1;
    });
    const ticketsByBrand = Object.keys(brandMap).map(brand => ({
      name: brand,
      value: brandMap[brand],
    }));

    // 6. Technician breakdown
    const techMap: Record<string, number> = {};
    tickets.forEach(t => {
      const techName = t.assignedTo?.name || "Unassigned";
      techMap[techName] = (techMap[techName] || 0) + 1;
    });
    const ticketsByTechnician = Object.keys(techMap).map(tech => ({
      name: tech,
      value: techMap[tech],
    }));

    // 7. Average Resolution Time (completed tickets in range)
    const completedTickets = await prisma.ticket.findMany({
      where: {
        tenantId,
        status: "COMPLETED",
        actualCompletionDate: { gte: startDate, lte: endDate },
      },
      select: {
        createdAt: true,
        actualCompletionDate: true,
      },
    });

    let totalHrs = 0;
    completedTickets.forEach(t => {
      if (t.actualCompletionDate) {
        totalHrs += (t.actualCompletionDate.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60);
      }
    });

    const averageResolutionTime = completedTickets.length > 0
      ? parseFloat(((totalHrs / completedTickets.length) / 24).toFixed(1))
      : 0;

    return {
      totalTickets,
      statusBreakdown,
      averageResolutionTime,
      ticketsByPriority,
      ticketsByCategory,
      ticketsByBrand,
      ticketsByTechnician,
    };
  },
};
