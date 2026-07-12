import * as assetRepo from './asset.repository.js';
import prisma from '../../config/db.js';
import { ConflictError, NotFoundError, BadRequestError } from '../../utils/errors.js';
import { logActivity } from '../activity-logs/activity-log.service.js';

export const createCategory = async (data, userId) => {
  const existing = await assetRepo.findCategoryByName(data.name);
  if (existing) {
    throw new ConflictError('Category name already exists');
  }
  const category = await assetRepo.createCategory(data);
  await logActivity(userId, 'CREATE_CATEGORY', `Created asset category ${category.name}`, { categoryId: category.id });
  return category;
};

export const getCategoryById = async (id) => {
  const category = await assetRepo.findCategoryById(id);
  if (!category) {
    throw new NotFoundError('Category not found');
  }
  return category;
};

export const getAllCategories = async (query) => {
  return await assetRepo.findAllCategories(query);
};

export const updateCategory = async (id, data, userId) => {
  const category = await getCategoryById(id);
  if (data.name && data.name !== category.name) {
    const existing = await assetRepo.findCategoryByName(data.name);
    if (existing) {
      throw new ConflictError('Category name already exists');
    }
  }
  const updated = await assetRepo.updateCategory(id, data);
  await logActivity(userId, 'UPDATE_CATEGORY', `Updated asset category ${updated.name}`, { categoryId: updated.id });
  return updated;
};

export const deleteCategory = async (id, userId) => {
  const category = await getCategoryById(id);
  const deleted = await assetRepo.softDeleteCategory(id);
  await logActivity(userId, 'DELETE_CATEGORY', `Soft-deleted asset category ${category.name}`, { categoryId: category.id });
  return deleted;
};

export const createAsset = async (data, userId) => {
  if (!data.assetTag) {
    const count = await prisma.asset.count();
    data.assetTag = `AF-${String(count + 1).padStart(6, '0')}`;
  }
  
  const existing = await assetRepo.findAssetByTag(data.assetTag);
  if (existing) {
    throw new ConflictError('Asset tag is already registered');
  }

  const asset = await assetRepo.createAsset(data);
  await logActivity(userId, 'CREATE_ASSET', `Registered asset ${asset.assetName} [${asset.assetTag}]`, { assetId: asset.id });
  return asset;
};

export const getAssetById = async (id) => {
  const asset = await assetRepo.findAssetById(id);
  if (!asset) {
    throw new NotFoundError('Asset not found');
  }
  return asset;
};

export const getAllAssets = async (query) => {
  return await assetRepo.findAllAssets(query);
};

export const updateAsset = async (id, data, userId) => {
  const asset = await getAssetById(id);
  if (data.assetTag && data.assetTag !== asset.assetTag) {
    const existing = await assetRepo.findAssetByTag(data.assetTag);
    if (existing) {
      throw new ConflictError('Asset tag is already registered');
    }
  }
  const updated = await assetRepo.updateAsset(id, data);
  await logActivity(userId, 'UPDATE_ASSET', `Updated asset details for ${updated.assetName} [${updated.assetTag}]`, { assetId: updated.id });
  return updated;
};

export const deleteAsset = async (id, userId) => {
  const asset = await getAssetById(id);
  const deleted = await assetRepo.softDeleteAsset(id);
  await logActivity(userId, 'DELETE_ASSET', `Soft-deleted asset ${asset.assetName} [${asset.assetTag}]`, { assetId: asset.id });
  return deleted;
};

export const getAssetHistory = async (id) => {
  await getAssetById(id);
  const history = await assetRepo.findAssetHistory(id);
  const timeline = [];
  
  history.allocations.forEach(alloc => {
    timeline.push({
      type: 'allocation',
      date: alloc.allocatedAt,
      description: `Allocated to ${alloc.employee.firstName} ${alloc.employee.lastName}. Status: ${alloc.status}`
    });
    if (alloc.returnedAt) {
      timeline.push({
        type: 'return',
        date: alloc.returnedAt,
        description: `Returned by ${alloc.employee.firstName} ${alloc.employee.lastName}. Condition note: ${alloc.returnConditionNote || 'None'}`
      });
    }
  });

  history.bookings.forEach(book => {
    timeline.push({
      type: 'booking',
      date: book.startTime,
      description: `Reserved by ${book.user.firstName} ${book.user.lastName} for ${book.purpose}. Status: ${book.status}`
    });
  });

  history.maintenances.forEach(maint => {
    timeline.push({
      type: 'maintenance',
      date: maint.createdAt,
      description: `Maintenance ticket reported by ${maint.requester.firstName} ${maint.requester.lastName}. Issue: ${maint.issueDescription}`
    });
  });

  history.transfers.forEach(xfer => {
    timeline.push({
      type: 'transfer',
      date: xfer.createdAt,
      description: `Transfer request from ${xfer.fromEmployee?.firstName || 'N/A'} to ${xfer.toEmployee?.firstName || 'N/A'}. Status: ${xfer.status}`
    });
  });

  history.auditItems.forEach(audit => {
    timeline.push({
      type: 'audit',
      date: audit.createdAt,
      description: `Verified in audit cycle [${audit.cycle.title}]. Verification: ${audit.verificationStatus}`
    });
  });

  return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const addAssetDocument = async (id, file, userId) => {
  if (!file) throw new BadRequestError('Document file is missing');
  await getAssetById(id);
  const doc = await assetRepo.createDocument({
    assetId: id,
    fileName: file.originalname,
    filePath: file.path,
    fileType: file.mimetype,
    fileSize: file.size,
    uploadedById: userId
  });
  await logActivity(userId, 'UPLOAD_DOCUMENT', `Uploaded document ${doc.fileName} for asset ID ${id}`, { assetId: id });
  return doc;
};

export const retireAsset = async (id, data, userId) => {
  await getAssetById(id);
  const updated = await assetRepo.updateAsset(id, {
    status: 'RETIRED',
    notes: `Retired: ${data.notes || 'No notes provided'}`
  });
  await logActivity(userId, 'RETIRE_ASSET', `Retired asset ${updated.assetName} [${updated.assetTag}]`, { assetId: updated.id });
  return updated;
};

export const disposeAsset = async (id, data, userId) => {
  await getAssetById(id);
  const updated = await assetRepo.updateAsset(id, {
    status: 'DISPOSED',
    notes: `Disposed: Reason: ${data.reason}. Cost recovery: $${data.recoveryValue || 0}. Notes: ${data.notes || 'None'}`
  });
  await logActivity(userId, 'DISPOSE_ASSET', `Disposed asset ${updated.assetName} [${updated.assetTag}]`, { assetId: updated.id });
  return updated;
};
