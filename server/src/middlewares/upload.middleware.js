import multer from 'multer';
import fs from 'fs';
import path from 'path';
import ApiError from '../utils/ApiError.js';

const baseUploadDir = './uploads';
const subDirs = ['assets', 'maintenance', 'profiles', 'documents'];

subDirs.forEach((dir) => {
  const fullPath = path.join(baseUploadDir, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = req.uploadFolder || 'documents';
    cb(null, path.join(baseUploadDir, folder));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.pdf'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (!allowedExtensions.includes(ext)) {
    return cb(new ApiError(400, `Forbidden file type. Only ${allowedExtensions.join(', ')} are allowed.`), false);
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

export const setUploadFolder = (folderName) => {
  return (req, res, next) => {
    req.uploadFolder = folderName;
    next();
  };
};

export default {
  upload,
  setUploadFolder,
};
