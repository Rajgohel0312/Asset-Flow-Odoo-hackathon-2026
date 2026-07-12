import prisma from '../../config/db.js';

export const getAssetReportData = async (params, requester) => {
  const role = requester.role.name;
  const isEmployee = role === 'EMPLOYEE';
  const isDeptHead = role === 'DEPARTMENT_HEAD';

  const where = {
    deletedAt: null,
    ...(isEmployee ? { allocations: { some: { employeeId: requester.id, status: 'ACTIVE' } } } : {}),
    ...(isDeptHead ? { departmentId: requester.departmentId } : {}),
  };

  const assets = await prisma.asset.findMany({
    where,
    include: {
      category: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { assetTag: 'asc' },
  });

  return assets.map((asset) => ({
    id: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.assetName,
    serialNumber: asset.serialNumber || 'N/A',
    category: asset.category.name,
    department: asset.department ? asset.department.name : 'Unassigned',
    purchaseDate: asset.purchaseDate ? asset.purchaseDate.toISOString().split('T')[0] : 'N/A',
    purchaseCost: parseFloat(asset.purchaseCost),
    condition: asset.condition,
    status: asset.status,
    isBookable: asset.isBookable,
  }));
};

export const getMaintenanceReportData = async (requester) => {
  const role = requester.role.name;
  const isEmployee = role === 'EMPLOYEE';
  const isDeptHead = role === 'DEPARTMENT_HEAD';

  const where = {
    deletedAt: null,
    ...(isEmployee ? { requestedBy: requester.id } : {}),
    ...(isDeptHead ? { asset: { departmentId: requester.departmentId } } : {}),
  };

  const requests = await prisma.maintenanceRequest.findMany({
    where,
    include: {
      asset: { select: { assetTag: true, assetName: true } },
      requester: { select: { firstName: true, lastName: true } },
      technician: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return requests.map((req) => ({
    id: req.id,
    assetTag: req.asset.assetTag,
    assetName: req.asset.assetName,
    requestedBy: `${req.requester.firstName} ${req.requester.lastName}`,
    priority: req.priority,
    issueDescription: req.issueDescription,
    status: req.status,
    technician: req.technician ? `${req.technician.firstName} ${req.technician.lastName}` : 'Unassigned',
    createdAt: req.createdAt,
    resolvedAt: req.resolvedAt,
  }));
};

export const getDepartmentReportData = async (requester) => {
  if (requester.role.name === 'EMPLOYEE') {
    return [];
  }

  const where = {
    deletedAt: null,
    ...(requester.role.name === 'DEPARTMENT_HEAD' ? { id: requester.departmentId } : {}),
  };

  const departments = await prisma.department.findMany({
    where,
    include: {
      departmentHead: { select: { firstName: true, lastName: true } },
      _count: { select: { users: true, assets: true } },
      assets: { select: { purchaseCost: true } },
    },
  });

  return departments.map((dept) => {
    const totalCost = dept.assets.reduce((sum, asset) => sum + parseFloat(asset.purchaseCost || 0), 0);
    return {
      id: dept.id,
      name: dept.name,
      description: dept.description,
      head: dept.departmentHead ? `${dept.departmentHead.firstName} ${dept.departmentHead.lastName}` : 'Unassigned',
      employeeCount: dept._count.users,
      assetCount: dept._count.assets,
      totalAssetCost: totalCost,
      status: dept.status,
    };
  });
};

export const getBookingsReportData = async (requester) => {
  const role = requester.role.name;
  const isEmployee = role === 'EMPLOYEE';
  const isDeptHead = role === 'DEPARTMENT_HEAD';

  const where = {
    deletedAt: null,
    ...(isEmployee ? { bookedBy: requester.id } : {}),
    ...(isDeptHead ? { asset: { departmentId: requester.departmentId } } : {}),
  };

  const bookings = await prisma.resourceBooking.findMany({
    where,
    include: {
      asset: { select: { assetTag: true, assetName: true } },
      user: { select: { firstName: true, lastName: true } },
    },
    orderBy: { startTime: 'desc' },
  });

  return bookings.map((b) => ({
    id: b.id,
    assetTag: b.asset.assetTag,
    assetName: b.asset.assetName,
    bookedBy: `${b.user.firstName} ${b.user.lastName}`,
    startTime: b.startTime,
    endTime: b.endTime,
    purpose: b.purpose,
    status: b.status,
  }));
};

export const getAuditReportData = async (requester) => {
  if (requester.role.name === 'EMPLOYEE') {
    return [];
  }

  const where = {
    ...(requester.role.name === 'DEPARTMENT_HEAD' ? { departmentId: requester.departmentId } : {}),
  };

  const cycles = await prisma.auditCycle.findMany({
    where,
    include: {
      department: { select: { name: true } },
      creator: { select: { firstName: true, lastName: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return cycles.map((c) => ({
    id: c.id,
    title: c.title,
    department: c.department ? c.department.name : 'All',
    location: c.location || 'N/A',
    startDate: c.startDate,
    endDate: c.endDate,
    status: c.status,
    creator: `${c.creator.firstName} ${c.creator.lastName}`,
    totalItems: c._count.items,
  }));
};

export const getUtilizationReportData = async (requester) => {
  const role = requester.role.name;
  if (role === 'EMPLOYEE') {
    return {};
  }

  const isDeptHead = role === 'DEPARTMENT_HEAD';
  const scopeWhere = isDeptHead ? { departmentId: requester.departmentId } : {};

  const [total, allocated, available, maintenance, other] = await Promise.all([
    prisma.asset.count({ where: { deletedAt: null, ...scopeWhere } }),
    prisma.asset.count({ where: { deletedAt: null, status: 'ALLOCATED', ...scopeWhere } }),
    prisma.asset.count({ where: { deletedAt: null, status: 'AVAILABLE', ...scopeWhere } }),
    prisma.asset.count({ where: { deletedAt: null, status: 'UNDER_MAINTENANCE', ...scopeWhere } }),
    prisma.asset.count({
      where: {
        deletedAt: null,
        status: { in: ['LOST', 'RETIRED', 'DISPOSED', 'RESERVED'] },
        ...scopeWhere,
      },
    }),
  ]);

  const utilizationRate = total > 0 ? ((allocated / total) * 100).toFixed(2) : '0.00';

  return {
    totalAssets: total,
    allocatedAssets: allocated,
    availableAssets: available,
    underMaintenanceAssets: maintenance,
    otherAssets: other,
    utilizationRatePercent: parseFloat(utilizationRate),
  };
};

export const getIdleAssetsReportData = async (requester) => {
  const role = requester.role.name;
  if (role === 'EMPLOYEE') return [];
  
  const isDeptHead = role === 'DEPARTMENT_HEAD';
  const scopeWhere = isDeptHead ? { departmentId: requester.departmentId } : {};

  const assets = await prisma.asset.findMany({
    where: {
      deletedAt: null,
      status: 'AVAILABLE',
      ...scopeWhere,
    },
    include: {
      category: { select: { name: true } },
      department: { select: { name: true } },
    },
    orderBy: { assetTag: 'asc' },
  });

  return assets.map((asset) => ({
    id: asset.id,
    assetTag: asset.assetTag,
    assetName: asset.assetName,
    category: asset.category.name,
    department: asset.department ? asset.department.name : 'Unassigned',
    purchaseCost: parseFloat(asset.purchaseCost),
    condition: asset.condition,
    location: asset.location || 'N/A',
    createdAt: asset.createdAt,
  }));
};

export const getOverdueAssetsReportData = async (requester) => {
  const role = requester.role.name;
  if (role === 'EMPLOYEE') return [];

  const isDeptHead = role === 'DEPARTMENT_HEAD';
  const scopeWhere = isDeptHead ? { departmentId: requester.departmentId } : {};

  const now = new Date();
  const allocations = await prisma.assetAllocation.findMany({
    where: {
      status: 'ACTIVE',
      expectedReturnDate: { lt: now },
      ...scopeWhere,
    },
    include: {
      asset: { select: { assetTag: true, assetName: true } },
      employee: { select: { firstName: true, lastName: true, email: true } },
    },
    orderBy: { expectedReturnDate: 'asc' },
  });

  return allocations.map((alloc) => ({
    id: alloc.id,
    assetTag: alloc.asset.assetTag,
    assetName: alloc.asset.assetName,
    employee: `${alloc.employee.firstName} ${alloc.employee.lastName}`,
    email: alloc.employee.email,
    allocatedAt: alloc.allocatedAt,
    expectedReturnDate: alloc.expectedReturnDate,
    daysOverdue: Math.floor((now - new Date(alloc.expectedReturnDate)) / (1000 * 60 * 60 * 24)),
  }));
};

export const convertToCSV = (data) => {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      const escaped = ('' + val).replace(/"/g, '\\"');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};
