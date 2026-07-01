import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { CSV_MIME_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@anomaly/shared';
import { BadRequestError } from '../utils/errors.js';

const tempUploadDir = path.resolve(process.cwd(), 'uploads', '.tmp');

function isCsvFile(file: Express.Multer.File) {
  const extension = path.extname(file.originalname).toLowerCase();
  return extension === '.csv' && CSV_MIME_TYPES.includes(file.mimetype as (typeof CSV_MIME_TYPES)[number]);
}

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    fs.mkdirSync(tempUploadDir, { recursive: true });
    callback(null, tempUploadDir);
  },
  filename: (_req, file, callback) => {
    const safeBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    callback(null, `${Date.now()}-${safeBase || 'transactions'}.csv`);
  },
});

export const uploadCsvMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_UPLOAD_SIZE_BYTES,
    files: 1,
  },
  fileFilter: (_req, file, callback) => {
    if (!isCsvFile(file)) {
      callback(new BadRequestError('Only CSV uploads are supported'));
      return;
    }

    callback(null, true);
  },
}).single('file');
