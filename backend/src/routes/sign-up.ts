import { Router } from "express";
import { signupUser } from "../controllers/sign-up";

const router = Router();

router.post('/', signupUser);

export default router;
