import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    createOrganization,
    getOrganization,
    updateOrganization,
    checkOrgCode
} from '../controllers/org.controller.js';

const router = Router();

router.get("/check/:orgCode", checkOrgCode);

// Optional: If creating org requires auth, apply middleware here or selectively
router.post("/", createOrganization); 
router.get("/:orgCode", getOrganization);
router.patch("/:orgCode", updateOrganization);

export default router;
