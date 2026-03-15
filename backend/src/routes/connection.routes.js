import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.middleware.js';
import {
    sendConnectionRequest,
    getConnections,
    getConnectionRequests,
    acceptConnection,
    rejectConnection,
    removeConnection
} from '../controllers/connection.controller.js';

const router = Router();

router.use(verifyJWT);

router.post("/", sendConnectionRequest);
router.get("/", getConnections);
router.get("/requests", getConnectionRequests);
router.patch("/:userId/accept", acceptConnection);
router.patch("/:userId/reject", rejectConnection);
router.delete("/:userId", removeConnection);

export default router;
