import { Router } from "express";
import { loginUser, logoutUser, verifyToken, submitFeedback } from "../controllers/authentication";

const router = Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-token', verifyToken);
router.post('/contact-us', submitFeedback);

export default router;
