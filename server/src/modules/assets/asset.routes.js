import { Router } from 'express';
import * as assetController from './asset.controller.js';
import { validate } from '../../middlewares/validation.middleware.js';
import { authenticate, authorize } from '../../middlewares/auth.middleware.js';
import { upload, setUploadFolder } from '../../middlewares/upload.middleware.js';
import {
  createCategorySchema,
  updateCategorySchema,
  createAssetSchema,
  updateAssetSchema,
  retireAssetSchema,
  disposeAssetSchema,
} from '../../validators/asset.validator.js';

const router = Router();

router.use(authenticate);

router.get('/categories', assetController.getAllCategories);
router.get('/categories/:id', assetController.getCategoryById);
router.post('/categories', authorize('ADMIN', 'ASSET_MANAGER'), validate(createCategorySchema), assetController.createCategory);
router.patch('/categories/:id', authorize('ADMIN', 'ASSET_MANAGER'), validate(updateCategorySchema), assetController.updateCategory);
router.delete('/categories/:id', authorize('ADMIN', 'ASSET_MANAGER'), assetController.deleteCategory);

router.get('/', assetController.getAll);
router.get('/:id', assetController.getById);
router.get('/:id/history', authorize('ADMIN', 'ASSET_MANAGER', 'DEPARTMENT_HEAD'), assetController.getHistory);

router.post('/', authorize('ADMIN', 'ASSET_MANAGER'), validate(createAssetSchema), assetController.create);
router.patch('/:id', authorize('ADMIN', 'ASSET_MANAGER'), validate(updateAssetSchema), assetController.update);
router.delete('/:id', authorize('ADMIN', 'ASSET_MANAGER'), assetController.remove);

router.patch('/:id/retire', authorize('ADMIN', 'ASSET_MANAGER'), validate(retireAssetSchema), assetController.retire);
router.patch('/:id/dispose', authorize('ADMIN', 'ASSET_MANAGER'), validate(disposeAssetSchema), assetController.dispose);

router.post(
  '/:id/documents',
  authorize('ADMIN', 'ASSET_MANAGER'),
  setUploadFolder('documents'),
  upload.single('file'),
  assetController.uploadDocument
);

export default router;
