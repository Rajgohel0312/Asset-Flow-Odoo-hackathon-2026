import * as assetService from './asset.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { toAssetDTO, toAssetListDTO } from '../../mappers/asset.mapper.js';

export const createCategory = asyncHandler(async (req, res, next) => {
  const category = await assetService.createCategory(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, category, 'Asset category created successfully')
  );
});

export const getCategoryById = asyncHandler(async (req, res, next) => {
  const category = await assetService.getCategoryById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, category, 'Asset category retrieved successfully')
  );
});

export const getAllCategories = asyncHandler(async (req, res, next) => {
  const result = await assetService.getAllCategories(req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, result.data, 'Asset categories retrieved successfully', meta)
  );
});

export const updateCategory = asyncHandler(async (req, res, next) => {
  const category = await assetService.updateCategory(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, category, 'Asset category updated successfully')
  );
});

export const deleteCategory = asyncHandler(async (req, res, next) => {
  await assetService.deleteCategory(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, null, 'Asset category deleted successfully')
  );
});

export const create = asyncHandler(async (req, res, next) => {
  const asset = await assetService.createAsset(req.body, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, toAssetDTO(asset), 'Asset registered successfully')
  );
});

export const getById = asyncHandler(async (req, res, next) => {
  const asset = await assetService.getAssetById(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, toAssetDTO(asset), 'Asset details retrieved successfully')
  );
});

export const getAll = asyncHandler(async (req, res, next) => {
  const result = await assetService.getAllAssets(req.query);
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const meta = {
    page,
    limit,
    total: result.total,
    pages: Math.ceil(result.total / limit),
  };

  return res.status(200).json(
    new ApiResponse(200, toAssetListDTO(result.data), 'Assets list retrieved successfully', meta)
  );
});

export const update = asyncHandler(async (req, res, next) => {
  const asset = await assetService.updateAsset(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, toAssetDTO(asset), 'Asset updated successfully')
  );
});

export const remove = asyncHandler(async (req, res, next) => {
  await assetService.deleteAsset(req.params.id, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, null, 'Asset deleted successfully')
  );
});

export const getHistory = asyncHandler(async (req, res, next) => {
  const history = await assetService.getAssetHistory(req.params.id);
  return res.status(200).json(
    new ApiResponse(200, history, 'Asset lifecycle timeline retrieved successfully')
  );
});

export const uploadDocument = asyncHandler(async (req, res, next) => {
  const doc = await assetService.addAssetDocument(req.params.id, req.file, req.user.id);
  return res.status(201).json(
    new ApiResponse(201, doc, 'Document uploaded and attached successfully')
  );
});

export const retire = asyncHandler(async (req, res, next) => {
  const asset = await assetService.retireAsset(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, toAssetDTO(asset), 'Asset retired successfully')
  );
});

export const dispose = asyncHandler(async (req, res, next) => {
  const asset = await assetService.disposeAsset(req.params.id, req.body, req.user.id);
  return res.status(200).json(
    new ApiResponse(200, toAssetDTO(asset), 'Asset disposed successfully')
  );
});
