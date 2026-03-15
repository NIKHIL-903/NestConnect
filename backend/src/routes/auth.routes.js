import { Router } from 'express';
import {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    getMe
} from '../controllers/auth.controller.js';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { upload } from '../middleware/multer.middleware.js';

const router = Router();

router.post("/register", upload.single("profileImage"), registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);

// Secured routes
router.post("/logout", verifyJWT, logoutUser);
router.get("/me", verifyJWT, getMe);

export default router;
