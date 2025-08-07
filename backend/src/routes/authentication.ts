import { Router } from "express";
import { loginUser, logoutUser, verifyToken } from "../controllers/authentication";

const router = Router();

router.post('/login', loginUser);
router.post('/logout', logoutUser);
router.post('/verify-token', verifyToken);

export default router;
