import { Router } from "express";
import { retrieveReadActivity, retrieveTopReadBooks} from "../controllers/dashboard";
import { authorizeToken } from "../middlewares/authorize-token";
import { matchUserId } from "../middlewares/match-user-id";

const router = Router();

router.get('/read-activity/:acct_id', authorizeToken, matchUserId, retrieveReadActivity);
router.get('/top-books/:acct_id', authorizeToken, matchUserId, retrieveTopReadBooks);

export default router;
