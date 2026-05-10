import express from 'express';
import { Router } from 'express';
import { upload } from '../middleware/multer.middleware.js';
import {
    bulkRegisterSeededUsers,
    bulkUploadSeededProfilePictures
} from '../controllers/seeded.controller.js';

const router = Router();

router.post('/bulk-register-seeded-users', express.json({ limit: '1mb' }), bulkRegisterSeededUsers);
router.post('/bulk-upload-seeded-profile-pictures', upload.array('images', 50), bulkUploadSeededProfilePictures);

export default router;
