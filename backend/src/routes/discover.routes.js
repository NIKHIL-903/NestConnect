import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { discoverUsers } from '../controllers/discover.controller.js';

const router = Router();

router.use(verifyJWT);

router.get("/", discoverUsers);

export default router;
