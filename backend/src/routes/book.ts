import { Router } from "express";
import { generateSignedS3UploadURL, addBook, retrieveAllBooks, retrieveABook, retrieveBooksNotes, rereadABook, unRereadABook } from "../controllers/book";
import { authorizeToken } from "../middlewares/authorize-token";
import { matchUserId } from "../middlewares/match-user-id";

const router = Router();

router.post('/upload-url/:acct_id', authorizeToken, matchUserId, generateSignedS3UploadURL);
router.post('/add-book/:acct_id', authorizeToken, matchUserId, addBook);

router.get('/all-books/:acct_id', authorizeToken, matchUserId, retrieveAllBooks);

router.get('/view-book/:acct_id/:book_id', authorizeToken, matchUserId, retrieveABook);
router.get('/view-notes/:acct_id/:book_id', authorizeToken, matchUserId, retrieveBooksNotes);
router.post('/reread/:acct_id/:book_id', authorizeToken, matchUserId, rereadABook);
router.post('/unreread/:acct_id/:book_id/:bra_id', authorizeToken, matchUserId, unRereadABook);

export default router;
