import { Router } from "express";
import { generateSignedS3UploadURL, addBook, retrieveAllBooks } from "../controllers/book";
import { authorizeToken } from "../middlewares/authorize-token";
import { matchUserId } from "../middlewares/match-user-id";

const router = Router();

router.post('/upload-url/:acct_id', authorizeToken, matchUserId, generateSignedS3UploadURL);
router.post('/add-book/:acct_id', authorizeToken, matchUserId, addBook);
router.get('/all-books/:acct_id', authorizeToken, matchUserId, retrieveAllBooks);

export default router;
