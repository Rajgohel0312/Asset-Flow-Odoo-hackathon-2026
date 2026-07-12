import prisma from '../../config/db.js';

// --- CATEGORY OPERATIONS ---
export const createCategory = async (data) => {
  return await prisma.assetCategory.create({ data });
};

export const findCategoryById = async (id) => {
  return await prisma.assetCategory.findFirst({
    where: { id, deletedAt: null },
  });
};

export const findCategoryByName = async (name) => {
  return await prisma.assetCategory.findFirst({
    where: { name, deletedAt: null },
  });
};

export const findAllCategories = async (params = {}) => {
  const pageVal = parseInt(params.page) || 1;
  const limitVal = parseInt(params.limit) || 10;
  const skip = (pageVal - 1) * limitVal;
  const search = params.search;

  const where = {
    deletedAt: null,
    ...(search ? {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.assetCategory.findMany({
      where,
      skip,
      take: limitVal,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { assets: true } },
      },
    }),
    prisma.assetCategory.count({ where }),
  ]);

  return { data, total };
};

export const updateCategory = async (id, data) => {
  return await prisma.assetCategory.update({
    where: { id },
    data,
  });
};

export const softDeleteCategory = async (id) => {
  return await prisma.assetCategory.update({
    where: { id },
    data: { deletedAt: new Date(), status: 'INACTIVE' },
  });
};

// --- ASSET OPERATIONS ---
export const createAsset = async (data) => {
  return await prisma.asset.create({
    data,
    include: {
      category: true,
      department: true,
    },
  });
};

export const findAssetById = async (id) => {
  return await prisma.asset.findFirst({
    where: { id, deletedAt: null },
    include: {
      category: true,
      department: true,
      documents: {
        include: { uploader: { select: { id: true, firstName: true, lastName: true, email: true } } },
      },
    },
  });
};

export const findAssetByTag = async (assetTag) => {
  return await prisma.asset.findFirst({
    where: { assetTag, deletedAt: null },
  });
};

export const findAllAssets = async (params = {}) => {
  const pageVal = parseInt(params.page) || 1;
  const limitVal = parseInt(params.limit) || 10;
  const skip = (pageVal - 1) * limitVal;
  const {
    search,
    categoryId,
    departmentId,
    status,
    condition,
    isBookable,
  } = params;

  const where = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
    ...(condition ? { condition } : {}),
    ...(isBookable !== undefined ? { isBookable: isBookable === 'true' || isBookable === true } : {}),
    ...(search ? {
      OR: [
        { assetName: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ],
    } : {}),
  };

  const [data, total] = await prisma.$transaction([
    prisma.asset.findMany({
      where,
      skip,
      take: limitVal,
      include: {
        category: true,
        department: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.asset.count({ where }),
  ]);

  return { data, total };
};

export const updateAsset = async (id, data) => {
  return await prisma.asset.update({
    where: { id },
    data,
    include: {
      category: true,
      department: true,
    },
  });
};

export const softDeleteAsset = async (id) => {
  return await prisma.asset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

export const createDocument = async (documentData) => {
  return await prisma.assetDocument.create({
    data: documentData,
  });
};

export const findAssetHistory = async (assetId) => {
  const [allocations, bookings, maintenances, transfers, auditItems] = await prisma.$transaction([
    prisma.assetAllocation.findMany({
      where: { assetId },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        approver: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { allocatedAt: 'desc' },
    }),
    prisma.resourceBooking.findMany({
      where: { assetId, deletedAt: null },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { startTime: 'desc' },
    }),
    prisma.maintenanceRequest.findMany({
      where: { assetId, deletedAt: null },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        technician: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.transferRequest.findMany({
      where: { assetId },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true } },
        fromEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
        toEmployee: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.auditItem.findMany({
      where: { assetId },
      include: {
        cycle: true,
        auditor: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return { allocations, bookings, maintenances, transfers, auditItems };
};
