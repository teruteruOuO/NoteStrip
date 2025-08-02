import { Router } from "express";
import { signupUser, resetSignupProcess, resendVerificationCode, removeAllVerificationCodes, verifyVerificationCode } from "../controllers/sign-up";

const router = Router();

router.post('/', signupUser);
router.post('/reset-progress', resetSignupProcess);
router.post('/resend-code', resendVerificationCode);
router.post('/expire-code', removeAllVerificationCodes);
router.post('/verify-code', verifyVerificationCode);

export default router;
