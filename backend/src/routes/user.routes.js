import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';
import {
    getUserProfile,
    updateUserProfile,
    getUserById,
    checkUserId,
    getPopularUsers
} from '../controllers/user.controller.js';

const router = Router();

// Public route for checking userId
router.get("/check-userid/:userId", checkUserId);

// Apply verifyJWT middleware to all routes below
router.use(verifyJWT);

router.get("/profile", getUserProfile);
router.get("/popular", getPopularUsers);
router.patch("/profile", upload.single("profileImage"), updateUserProfile);
router.get("/:userId", getUserById);

export default router;
