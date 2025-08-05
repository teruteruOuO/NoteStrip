import { Router } from "express";
import { sendVerificationCode, cancelVerificationCode, resendVerificationCode, verifyVerificationCode, changePassword } from "../controllers/password-recovery";

const router = Router();

router.post('/send-verification-code', sendVerificationCode);
router.post('/cancel-verification-code', cancelVerificationCode);
router.post('/resend-verification-code', resendVerificationCode);
router.post('/verify-verification-code', verifyVerificationCode);
router.post('/', changePassword);

export default router;
