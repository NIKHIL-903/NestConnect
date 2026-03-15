import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import { getChatHistory } from '../controllers/message.controller.js';

const router = Router();

router.use(verifyJWT);

router.get("/:connectionId", getChatHistory);

export default router;
