import prisma from "../../config/db.js";
import { ApiError } from "../../utils/ApiError.js";
import { getPagination } from "../../utils/pagination.js";
import { getSearchQuery } from "../../utils/search.js";
import { getSortQuery } from "../../utils/sort.js";
import { generateAssetTag } from "../../utils/generateAssetTag.js";
import logger from "../../config/logger.js";

export const createCategory = async (data, creatorId) => {
  const { name, description, defaultMaintenanceDays } = data;

  const existing = await prisma.assetCategory.findFirst({
    where: { name, deletedAt: null },
  });
  if (existing) {
    throw new ApiError(409, "Asset category already exists");
  }

  const category = await prisma.assetCategory.create({
    data: {
      name,
      description,
      defaultMaintenanceDays,
    },
  });

  logger.info(`Category created: ${category.name}`, { id: category.id });
  return category;
};

export const getCategoryById = async (id) => {
  const category = await prisma.assetCategory.findFirst({
    where: { id, deletedAt: null },
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }
  return category;
};

export const getAllCategories = async (params = {}) => {
  const { page, limit, skip } = getPagination(params);
  const { search } = params;

  const where = { deletedAt: null };
  if (search) {
    where.AND = [getSearchQuery(["name", "description"], search)];
  }

  const sort = getSortQuery(params, "name", "asc");

  const [data, total] = await prisma.$transaction([
    prisma.assetCategory.findMany({
      where,
      skip,
      take: limit,
      orderBy: sort,
    }),
    prisma.assetCategory.count({ where }),
  ]);

  return { data, total };
};

export const updateCategory = async (id, data, modifierId) => {
  const category = await prisma.assetCategory.findFirst({
    where: { id, deletedAt: null },
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const updated = await prisma.assetCategory.update({
    where: { id },
    data,
  });


  logger.info(`Category updated: ${updated.name}`, { id });
  return updated;
};

export const deleteCategory = async (id, destroyerId) => {
  const category = await prisma.assetCategory.findFirst({
    where: { id, deletedAt: null },
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const activeAssetsCount = await prisma.asset.count({
    where: { categoryId: id, deletedAt: null },
  });
  if (activeAssetsCount > 0) {
    throw new ApiError(
      400,
      `Cannot delete category. There are ${activeAssetsCount} active assets assigned to it.`,
    );
  }

  const deleted = await prisma.assetCategory.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  logger.info(`Category deleted: ${category.name}`, { id });
  return deleted;
};

export const createAsset = async (data, creatorId) => {
  const {
    assetTag,
    serialNumber,
    categoryId,
    departmentId,
    assetName,
    purchaseDate,
    purchaseCost,
    warrantyExpiry,
    location,
    condition,
    status,
    isBookable,
    notes,
  } = data;

  const category = await prisma.assetCategory.findFirst({
    where: { id: categoryId, deletedAt: null },
  });
  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null },
    });
    if (!dept) {
      throw new ApiError(404, "Department not found");
    }
  }

  let finalAssetTag = assetTag;
  if (!finalAssetTag) {
    finalAssetTag = await generateAssetTag();
  } else {
    const existing = await prisma.asset.findUnique({
      where: { assetTag: finalAssetTag },
    });
    if (existing) {
      throw new ApiError(409, `Asset with tag ${finalAssetTag} already exists`);
    }
  }

  const asset = await prisma.asset.create({
    data: {
      assetTag: finalAssetTag,
      serialNumber,
      categoryId,
      departmentId,
      assetName,
      purchaseDate,
      purchaseCost,
      warrantyExpiry,
      location,
      condition,
      status,
      isBookable,
      notes,
    },
    include: { category: true, department: true },
  });

  logger.info(`Asset created: ${asset.assetName} [${asset.assetTag}]`, {
    id: asset.id,
  });
  return asset;
};

export const getAssetById = async (id) => {
  const asset = await prisma.asset.findFirst({
    where: { id, deletedAt: null },
    include: { category: true, department: true, documents: true },
  });
  if (!asset) {
    throw new ApiError(404, "Asset not found");
  }
  return asset;
};

export const getAllAssets = async (params = {}) => {
  const { page, limit, skip } = getPagination(params);
  const { search, categoryId, departmentId, status, condition, isBookable } =
    params;

  const where = {
    deletedAt: null,
    ...(categoryId ? { categoryId } : {}),
    ...(departmentId ? { departmentId } : {}),
    ...(status ? { status } : {}),
    ...(condition ? { condition } : {}),
    ...(isBookable !== undefined
      ? { isBookable: isBookable === "true" || isBookable === true }
      : {}),
  };

  if (search) {
    where.AND = [
      getSearchQuery(
        ["assetName", "assetTag", "serialNumber", "location"],
        search,
      ),
    ];
  }

  const sort = getSortQuery(params, "assetTag", "asc");

  const [data, total] = await prisma.$transaction([
    prisma.asset.findMany({
      where,
      skip,
      take: limit,
      include: { category: true, department: true },
      orderBy: sort,
    }),
    prisma.asset.count({ where }),
  ]);

  return { data, total };
};

export const updateAsset = async (id, data, modifierId) => {
  const asset = await prisma.asset.findFirst({
    where: { id, deletedAt: null },
  });
  if (!asset) {
    throw new ApiError(404, "Asset not found");
  }

  const { categoryId, departmentId } = data;

  if (categoryId) {
    const category = await prisma.assetCategory.findFirst({
      where: { id: categoryId, deletedAt: null },
    });
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
  }

  if (departmentId) {
    const dept = await prisma.department.findFirst({
      where: { id: departmentId, deletedAt: null },
    });
    if (!dept) {
      throw new ApiError(404, "Department not found");
    }
  }

  const updated = await prisma.asset.update({
    where: { id },
    data,
    include: { category: true, department: true },
  });


  logger.info(`Asset updated: ${updated.assetTag}`, { id });
  return updated;
};

export const deleteAsset = async (id, destroyerId) => {
  const asset = await prisma.asset.findFirst({
    where: { id, deletedAt: null },
  });
  if (!asset) {
    throw new ApiError(404, "Asset not found");
  }

  const deleted = await prisma.asset.update({
    where: { id },
    data: { deletedAt: new Date() },
  });


  logger.info(`Asset deleted: ${asset.assetTag}`, { id });
  return deleted;
};

export const addAssetDocument = async (assetId, file, uploaderId) => {
  if (!file) {
    throw new ApiError(400, "Document file is required");
  }

  const asset = await prisma.asset.findUnique({
    where: { id: assetId },
  });
  if (!asset) {
    throw new ApiError(404, "Asset not found");
  }

  const doc = await prisma.assetDocument.create({
    data: {
      assetId,
      fileName: file.originalname,
      filePath: file.path.replace(/\\/g, "/"),
      uploadedBy: uploaderId,
    },
  });


  logger.info(`Attached document to asset ${asset.assetTag}`, { id: doc.id });
  return doc;
};

