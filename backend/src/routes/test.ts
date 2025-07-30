import { Router } from "express";
import { getTestTable } from "../controllers/test";

const router = Router();

router.get('/', getTestTable);

export default router;
