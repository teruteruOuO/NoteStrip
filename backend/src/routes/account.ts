import { Router } from "express";
import { retrieveEmail, sendVerificationCode, cancelChangeEmailProcess, resendVerificationCode, verifyVerificationCode } from "../controllers/account";
import { authorizeToken } from "../middlewares/authorize-token";
import { matchUserId } from "../middlewares/match-user-id";

const router = Router();

router.get('/email/:acct_id', authorizeToken, matchUserId, retrieveEmail);
router.post('/email/send-verification-code/:acct_id', authorizeToken, matchUserId, sendVerificationCode);
router.post('/email/cancel-verification-code/:acct_id', authorizeToken, matchUserId, cancelChangeEmailProcess);
router.post('/email/resend-verification-code/:acct_id', authorizeToken, matchUserId, resendVerificationCode);
router.post('/email/verify-verification-code/:acct_id', authorizeToken, matchUserId, verifyVerificationCode);

export default router;
