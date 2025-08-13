import { Router } from "express";
import { generateSignedS3UploadURL, addBook, retrieveAllBooks, viewABook, 
    retrieveBooksNotes, rereadABook, unRereadABook, addNote, deleteNote, updateNote,
    retrieveBookForUpdate, replaceSignedS3UploadURL, updateBook, deleteBook } from "../controllers/book";
import { authorizeToken } from "../middlewares/authorize-token";
import { matchUserId } from "../middlewares/match-user-id";

const router = Router();

// Add a book
router.post('/upload-url/:acct_id', authorizeToken, matchUserId, generateSignedS3UploadURL);
router.post('/add-book/:acct_id', authorizeToken, matchUserId, addBook);

// Retrieve all books
router.get('/all-books/:acct_id', authorizeToken, matchUserId, retrieveAllBooks);

// View a book
router.get('/view-book/:acct_id/:book_id', authorizeToken, matchUserId, viewABook);

// REST API for a book's notes
router.get('/view-notes/:acct_id/:book_id', authorizeToken, matchUserId, retrieveBooksNotes);
router.post('/add-note/:acct_id/:book_id', authorizeToken, matchUserId, addNote);
router.post('/delete-note/:acct_id/:book_id/:note_id', authorizeToken, matchUserId, deleteNote);
router.post('/update-note/:acct_id/:book_id/:note_id', authorizeToken, matchUserId, updateNote);

// Rereading/Unrereading a book
router.post('/reread/:acct_id/:book_id', authorizeToken, matchUserId, rereadABook);
router.post('/unreread/:acct_id/:book_id/:bra_id', authorizeToken, matchUserId, unRereadABook);

// Edit a book
router.get('/edit/retrieve-book/:acct_id/:book_id', authorizeToken, matchUserId, retrieveBookForUpdate);
router.post('/edit/replace-upload-url/:acct_id', authorizeToken, matchUserId, replaceSignedS3UploadURL);
router.post('/edit/update-book/:acct_id/:book_id', authorizeToken, matchUserId, updateBook);

// Delete a book
router.post('/edit/delete-book/:acct_id/:book_id', authorizeToken, matchUserId, deleteBook);


export default router;
