import prisma from '../../config/db.js';

export const getDashboardData = async (requester) => {
  const role = requester.role.name;
  const isEmployee = role === 'EMPLOYEE';
  const isDeptHead = role === 'DEPARTMENT_HEAD';

  let kpis = {};
  if (isEmployee) {
    const [allocatedCount, bookingCount, maintenanceCount] = await Promise.all([
      prisma.assetAllocation.count({ where: { employeeId: requester.id, status: 'ACTIVE' } }),
      prisma.resourceBooking.count({ where: { bookedBy: requester.id, deletedAt: null } }),
      prisma.maintenanceRequest.count({ where: { requestedBy: requester.id, deletedAt: null } }),
    ]);
    kpis = {
      allocatedAssets: allocatedCount,
      bookingsCount: bookingCount,
      maintenanceRequestsRaised: maintenanceCount,
    };
  } else {
    const scopeWhere = isDeptHead ? { departmentId: requester.departmentId } : {};

    const [totalAssets, activeAllocations, pendingMaintenance, upcomingBookings] = await Promise.all([
      prisma.asset.count({ where: { deletedAt: null, ...scopeWhere } }),
      prisma.assetAllocation.count({
        where: {
          status: 'ACTIVE',
          ...(isDeptHead ? { departmentId: requester.departmentId } : {}),
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          status: { in: ['PENDING', 'APPROVED', 'ASSIGNED', 'IN_PROGRESS'] },
          deletedAt: null,
          ...(isDeptHead ? { asset: { departmentId: requester.departmentId } } : {}),
        },
      }),
      prisma.resourceBooking.count({
        where: {
          status: 'UPCOMING',
          deletedAt: null,
          ...(isDeptHead ? { asset: { departmentId: requester.departmentId } } : {}),
        },
      }),
    ]);

    kpis = {
      totalAssets,
      activeAllocations,
      activeMaintenanceRequests: pendingMaintenance,
      upcomingBookings,
    };
  }

  let charts = {};
  if (!isEmployee) {
    const scopeWhere = isDeptHead ? { departmentId: requester.departmentId } : {};

    const statusDistribution = await prisma.asset.groupBy({
      by: ['status'],
      where: { deletedAt: null, ...scopeWhere },
      _count: { status: true },
    });

    const categoryDistribution = await prisma.asset.groupBy({
      by: ['categoryId'],
      where: { deletedAt: null, ...scopeWhere },
      _count: { categoryId: true },
    });

    const categoriesList = await prisma.assetCategory.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true },
    });
    const catMap = categoriesList.reduce((acc, cat) => ({ ...acc, [cat.id]: cat.name }), {});
    const formattedCategories = categoryDistribution.map((item) => ({
      category: catMap[item.categoryId] || 'Unknown',
      count: item._count.categoryId,
    }));

    let formattedDepartments = [];
    if (!isDeptHead) {
      const deptDistribution = await prisma.asset.groupBy({
        by: ['departmentId'],
        where: { deletedAt: null },
        _count: { departmentId: true },
      });
      const deptsList = await prisma.department.findMany({
        where: { deletedAt: null },
        select: { id: true, name: true },
      });
      const deptMap = deptsList.reduce((acc, d) => ({ ...acc, [d.id]: d.name }), {});
      formattedDepartments = deptDistribution.map((item) => ({
        department: item.departmentId ? deptMap[item.departmentId] || 'Unassigned' : 'Unassigned',
        count: item._count.departmentId,
      }));
    }

    const maintenanceRequests = await prisma.maintenanceRequest.groupBy({
      by: ['priority'],
      where: {
        deletedAt: null,
        ...(isDeptHead ? { asset: { departmentId: requester.departmentId } } : {}),
      },
      _count: { priority: true },
    });

    charts = {
      assetStatusUtilization: statusDistribution.map((item) => ({
        status: item.status,
        count: item._count.status,
      })),
      categoryDistribution: formattedCategories,
      ...(!isDeptHead ? { departmentDistribution: formattedDepartments } : {}),
      maintenancePriorityDistribution: maintenanceRequests.map((item) => ({
        priority: item.priority,
        count: item._count.priority,
      })),
    };
  }

  let recentActivities = [];
  if (isEmployee) {
    recentActivities = await prisma.notification.findMany({
      where: { userId: requester.id },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
  } else {
    const scopeWhere = isDeptHead ? { user: { departmentId: requester.departmentId } } : {};
    recentActivities = await prisma.activityLog.findMany({
      where: scopeWhere,
      take: 5,
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  return {
    kpis,
    charts,
    recentActivities,
  };
};
