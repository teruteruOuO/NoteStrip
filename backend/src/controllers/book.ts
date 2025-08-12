import { Request, Response, NextFunction } from 'express';
import { AppError, IDecodedTokenPayload, ITransactionQuery } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { PersonalS3Bucket } from '../config/s3-bucket';

// Add a Book (Step 1 of 2: Generate signed s3 Upload URL)
export const generateSignedS3UploadURL = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { file_name, content_type } = req.body as { file_name: string, content_type: any };
        const userInformation = req.user as IDecodedTokenPayload
        let signedUrl: string;
        let imageLocation: string;
        let error: AppError;

        console.log(`Processing generateSignedS3UploadURL...`);

        // Discontinue if file name or content type is missing
        console.log(`Checking if ${userInformation.email} provided the file name or content type of the image...`);
        if (!file_name || !content_type) {
            error = new Error(`${userInformation.email} did not provide the file name or content type of the image`);
            error.status = 404;
            error.frontend_message = "Missing file name or content type.";
            throw error;
        }
        console.log(`${userInformation.email}'s file name (${file_name}) and content type (${content_type}) found!`);

        // Generate an upload url for the image
        console.log(`Generating an S3 upload url for ${userInformation.email}'s new book and its image location...`);
        signedUrl = await PersonalS3Bucket.generateUploadUrl(file_name, content_type);
        imageLocation = `${PersonalS3Bucket.bookImagesLocation}/${file_name}`;
        console.log(`Successfully generated an S3 upload url for ${userInformation.email}'s image file (${file_name})`);

        res.status(201).json({
            message: 'Successfully generated a signed s3 upload url',
            signed_url: signedUrl,
            image_location: imageLocation
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Add a Book (Step 2 of 2: Store book information to the database)
export const addBook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let resultQuery: any[];
        let error: AppError;
        let bookId: number;
        const userInformation = req.user as IDecodedTokenPayload;
        const { title, image, plot_description, extra_information, release_date, end_date } = req.body as 
        { title: string, image: string, plot_description: string | null, extra_information: string | null, release_date: string | null, end_date: string | null };

        console.log('Processing addBook...');

        // Discontinue if file name or content type is missing
        console.log(`Checking if ${userInformation.email} provided the required attributes: book title and book image location`);
        if (!title || !image) {
            error = new Error(`${userInformation.email} did not provide the book title or the book image's location`);
            error.status = 404;
            error.frontend_message = "Missing book title or book image location";
            throw error;
        }
        console.log(`${userInformation.email}'s book title (${title}) and its image location (${image}) are found!`);

        // Store the book information to the database
        console.log(`Storing ${userInformation.email}'s book (${title}) to the database...`);
        transactionQuery = [
            {
                query: 'INSERT INTO BOOK (ACCT_ID, BOOK_TITLE, BOOK_IMG, BOOK_PLOT_DESC, BOOK_EXTRA_INFO, BOOK_DATE_RELEASE, BOOK_DATE_END) VALUES (?, ?, ?, ?, ?, ?, ?);',
                params: [userInformation.id, title, image, plot_description, extra_information, release_date, end_date]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [userInformation.id, 'user', `User successfully added book titled ${title}`]
            },
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        bookId = resultQuery[0].insertId;
        console.log(`Successfully added the book (${title}) of ${userInformation.email} in the database!`);

        res.status(201).json({
            message: `Successfully added the book titled (${title})!`,
            book_id: bookId,
            name: title
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Retrieve a user's list of books
export const retrieveAllBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        type Books = { id: number, title: string, image_source: string }
        let selectQuery: string;
        let resultQuery: any[];
        let books: Array<Books> = []; // initialize as []
        const userInformation = req.user as IDecodedTokenPayload;

        console.log('Processing retrieveBooks...');

        // Retrieve all of the user's books
        console.log(`Retrieving all of ${userInformation.email}'s books...`);
        selectQuery = "SELECT BOOK_ID, BOOK_TITLE, BOOK_IMG FROM BOOK WHERE ACCT_ID = ? ORDER BY BOOK_TIMESTAMP DESC;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [userInformation.id]);
        console.log(`Successfully retrieved all of ${userInformation.email}'s books!`);

        if (resultQuery.length > 0) {
            books = await Promise.all(
                resultQuery.map(async (book: any): Promise<Books> => ({
                    id: book.BOOK_ID,
                    title: book.BOOK_TITLE,
                    image_source: await PersonalS3Bucket.RetrieveImageUrl(book.BOOK_IMG),
                }))
            );
        }

        res.status(200).json({
            message: `Successfully retrieved all books`,
            books: books
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Retrieve a single book
export const retrieveABook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        type LatestReadActivity = { id: number, latest_read: string }
        type BookInformation = { id: number, title: string, img: string, plot_description: string | null, extra_information: string | null, release_date: string | null, end_date: string | null, reread: 'yes' | 'no' | null , date_added: string };
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let bookInformation: BookInformation;
        let latestReadActivity: LatestReadActivity | null;
        let readAmount = 0;
        const book_id = Number(req.params.book_id);
        const userInformation = req.user as IDecodedTokenPayload;

        console.log('Processing retrieveABook...');

        // Ensure the parameter exists
        console.log(`Checking if ${userInformation.email}'s book ID exists in the parameters...`);
        if (!book_id) {
            error = new Error(`${userInformation.email} did not provide the book's ID in the parameters`);
            error.status = 404;
            error.frontend_message = "Missing the book's identification number";
            throw error;
        }
        console.log(`Found the book id in  ${userInformation.email}'s parameter!`);

        // Find the book
        console.log(`Finding ${userInformation.email}'s book with the id of ${book_id} from the database...`);
        selectQuery = `
                    SELECT 
                        BOOK_ID, 
                        BOOK_TITLE, 
                        BOOK_IMG, 
                        BOOK_PLOT_DESC, 
                        BOOK_EXTRA_INFO, 
                        DATE_FORMAT(BOOK_DATE_RELEASE, '%M %e, %Y') AS BOOK_DATE_RELEASE,
                        DATE_FORMAT(BOOK_DATE_END, '%M %e, %Y')      AS BOOK_DATE_END,
                        DATE_FORMAT(BOOK_TIMESTAMP, '%M %e, %Y %l:%i %p') AS BOOK_TIMESTAMP
                    FROM BOOK WHERE ACCT_ID = ? 
                    AND BOOK_ID = ?;`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [userInformation.id, book_id]);
        if (resultQuery.length !== 1) {
            error = new Error(`Book ID of ${book_id} does not exist for ${userInformation.email}`);
            error.status = 404;
            error.frontend_message = "Book does not exist for this account";
            throw error;
        }
        bookInformation = {
            id: resultQuery[0].BOOK_ID,
            title: resultQuery[0].BOOK_TITLE,
            img: await PersonalS3Bucket.RetrieveImageUrl(resultQuery[0].BOOK_IMG),
            plot_description: resultQuery[0].BOOK_PLOT_DESC,
            extra_information: resultQuery[0].BOOK_EXTRA_INFO,
            release_date: resultQuery[0].BOOK_DATE_RELEASE,
            end_date: resultQuery[0].BOOK_DATE_END,
            reread: null,
            date_added: resultQuery[0].BOOK_TIMESTAMP
        }
        console.log(`Found ${userInformation.email}'s book! ${bookInformation.title} (#${bookInformation.id})!`);

        // Retrieve the latest activity read for this book
        console.log(`Retrieving the latest activity read (last 10 hours) of ${bookInformation.title} by ${userInformation.email}...`);
        selectQuery = `SELECT BR_ACTIVITY_ID, DATE_FORMAT(BR_ACTIVITY_LATEST_READ, '%M %e, %Y %l:%i %p') AS BR_ACTIVITY_LATEST_READ
                        FROM BOOK_READ_ACTIVITY
                    WHERE BOOK_ID = ?
                    AND BR_ACTIVITY_LATEST_READ >= (NOW() - INTERVAL 10 HOUR);`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [bookInformation.id]);

        if (resultQuery.length == 1) {
            latestReadActivity = {
                id: resultQuery[0].BR_ACTIVITY_ID,
                latest_read: resultQuery[0].BR_ACTIVITY_LATEST_READ
            }
            bookInformation.reread = 'yes'
            console.log(`Found the latest record activity for ${userInformation.email}'s book ${bookInformation.title}. Book Reread should have a value of 'yes'`);
        } else {
            latestReadActivity = null;
            bookInformation.reread = 'no'
            console.log(`There seems to be no latest book read activity for ${userInformation.email}'s book ${bookInformation.title}. Book Reread should have a value of 'no'`);
        }

        // Retrieve the amount of times this book has been read
        console.log(`Retrieving the amount of times ${bookInformation.title} has been reread by ${userInformation.email}...`);
        selectQuery = `SELECT COUNT(*) AS REREAD_AMOUNT
                        FROM BOOK_READ_ACTIVITY
                    WHERE BOOK_ID = ?;`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [bookInformation.id]);

        if (resultQuery.length == 1) {
            readAmount = resultQuery[0].REREAD_AMOUNT;
        }
        console.log(`${userInformation.email} has read ${bookInformation.title} ${readAmount} time(s)!`);

        res.status(200).json({
            message: `Successfully retrieved the book ${bookInformation.title}`,
            book: bookInformation,
            latest_read_activity: latestReadActivity,
            read_amount: readAmount
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Reread a book
export const rereadABook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let { book_title } = req.body as { book_title: string};
        const book_id = Number(req.params.book_id);
        const userInformation = req.user as IDecodedTokenPayload;

        console.log('Processing rereadABook...');

        // Ensure the parameter exists
        console.log(`Checking if ${userInformation.email}'s book ID exists in the parameters and book title in the req.body...`);
        if (!book_id || !book_title) {
            error = new Error(`${userInformation.email} did not provide the book's ID in the parameters or the book title in the request body`);
            error.status = 404;
            error.frontend_message = "Missing the book's identification number and/or the book title";
            throw error;
        }
        console.log(`Found the book id in  ${userInformation.email}'s parameter!`);

        // Ensure there's no read activity from the past 10 hrs
        console.log(`Checking to see if ${userInformation.email} has already reread book ${book_title} within the last 10 hours...`);
        selectQuery = `SELECT BR_ACTIVITY_ID, DATE_FORMAT(BR_ACTIVITY_LATEST_READ, '%M %e, %Y %l:%i %p') AS BR_ACTIVITY_LATEST_READ
                        FROM BOOK_READ_ACTIVITY
                    WHERE BOOK_ID = ?
                    AND BR_ACTIVITY_LATEST_READ >= (NOW() - INTERVAL 10 HOUR);`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [book_id]);
        if (resultQuery.length >= 1) {
            error = new Error(`${userInformation.email} has already reread book ${book_title} within the last 10 hours`);
            error.status = 400;
            error.frontend_message = "You've already read the book within the last 10 hours. Come back again after 10 hours";
            throw error;
        }

        // Perform reread activity
        console.log(`Recording reread activity of book ${book_title} for ${userInformation.email}...`);
        transactionQuery = [
            {
                query: "INSERT INTO BOOK_READ_ACTIVITY (BOOK_ID) VALUES (?);",
                params: [book_id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [userInformation.id, 'user', `User successfully reread the book ${book_title}`]
            },
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully recorded reread activity of book ${book_title} for ${userInformation.email} in the database!`);

        res.status(200).json({ message: `Successfully reread the book` });
        return;

    } catch (err: unknown) {
        next(err);
    }

}

// Revert a reread (Un-reread) a book
export const unRereadABook = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let { book_title } = req.body as { book_title: string};
        const book_id = Number(req.params.book_id);
        const book_read_acivity_id = Number(req.params.bra_id);
        const userInformation = req.user as IDecodedTokenPayload;

        console.log('Processing unRereadABook...');

        // Ensure the parameter exists
        console.log(`Checking if ${userInformation.email}'s book ID and book read activity ID exist in the parameters as well as the book title...`);
        if (!book_id || !book_read_acivity_id || !book_title) {
            error = new Error(`${userInformation.email} did not provide the book's ID or book read activity ID in the parameters or the book title in the request body`);
            error.status = 404;
            error.frontend_message = "Missing the book's identification number, boook read activity, and/or the book title";
            throw error;
        }
        console.log(`Found the book id in ${userInformation.email}'s parameter!`);

        // Perform a revert on reread activity
        console.log(`Recording reread activity of book ${book_title} for ${userInformation.email}...`);
        transactionQuery = [
            {
                query: "DELETE FROM BOOK_READ_ACTIVITY WHERE BR_ACTIVITY_ID = ?;",
                params: [book_read_acivity_id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [userInformation.id, 'user', `User reverted their read action on ${book_title} for today`]
            },
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully reverted reread activity of book ${book_title} for ${userInformation.email} in the database!`);

        res.status(200).json({ message: `Successfully reverted the reread activity of the book` });
        return;

    } catch (err: unknown) {
        next(err);
    }

}

// Retrieve all notes for a single book
export const retrieveBooksNotes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        type Notes = { id: number, timestamp: string, title: string, content: string };
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let notes: Array<Notes> = []; // initialize as [];
        const userInformation = req.user as IDecodedTokenPayload;
        const book_id = Number(req.params.book_id);

        console.log('Processing retrieveBooksNotes...');

        // Ensure the parameter exists
        console.log(`Checking if ${userInformation.email}'s book ID exists in the parameters...`);
        if (!book_id) {
            error = new Error(`${userInformation.email} did not provide the book's ID in the parameters`);
            error.status = 404;
            error.frontend_message = "Missing the book's identification number";
            throw error;
        }
        console.log(`Found the book id in  ${userInformation.email}'s parameter!`);

        // If the book does not exist, throw an error
        console.log(`Checking if ${book_id} exists for ${userInformation.email}...`);
        selectQuery = "SELECT BOOK_ID FROM BOOK WHERE BOOK_ID = ? AND ACCT_ID = ?;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [book_id, userInformation.id]);
        if (resultQuery.length <= 0) {
            error = new Error(`${userInformation.email}'s book (#${book_id}) does not exist in the database`);
            error.status = 404;
            error.frontend_message = "Book does not exist for this account";
            throw error;
        }
        console.log(`Found ${userInformation.email} book (#${book_id}) in the database!`);

        // Retrieve all notes for the book
        console.log(`Retrieving all of ${userInformation.email}'s notes for their book #${book_id}...`);
        selectQuery = `SELECT
                        NOTE_ID,
                        DATE_FORMAT(NOTE_TIMESTAMP, '%M %e, %Y %l:%i %p') AS NOTE_TIMESTAMP,
                        NOTE_CONTENT,
                        NOTE_TITLE
                    FROM BOOK AS B
                    JOIN NOTE AS N
                    ON B.BOOK_ID = N.BOOK_ID
                    WHERE N.BOOK_ID = ?
                    AND ACCT_ID = ?
                    ORDER BY NOTE_TIMESTAMP DESC;`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [book_id, userInformation.id]);
        console.log(`Successfully retrieved ${userInformation.email}'s notes for book #${book_id}!`);

        if (resultQuery.length >= 1) {
            notes = resultQuery.map(note => {
                return {
                    id: note.NOTE_ID,
                    timestamp: note.NOTE_TIMESTAMP,
                    title: note.NOTE_TITLE,
                    content: note.NOTE_CONTENT
                }
            });
        }

        res.status(200).json({
            message: `Successfully retrieved all notes for book ${book_id}`,
            notes: notes
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Add a new note for a book
export const addNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let resultQuery: any[];
        let error: AppError;
        const { title, content, name } = req.body as { title: string, content: string, name: string };
        const userInformation = req.user as IDecodedTokenPayload;
        const book_id = Number(req.params.book_id);
        
        console.log('Processing addNote...');

        // Ensure the parameter exists
        console.log(`Checking if ${userInformation.email}'s book ID exists in the parameters as well as the note's title and content and name of the book in the request body...`);
        if (!book_id || !title || !content || !name) {
            error = new Error(`${userInformation.email} did not provide the book's ID in the parameters OR title and content OR name of the book in the request body`);
            error.status = 404;
            error.frontend_message = "Missing the book's identification number the note's title and content, and name of the book";
            throw error;
        }
        console.log(`Found the book id in ${userInformation.email}'s parameter as well as the notes' title and content!`);

        // Add note
        console.log(`Adding note ${title} for ${userInformation.email}'s book ${name} in the database...`);
        transactionQuery = [
            {
                query: "INSERT INTO NOTE (BOOK_ID, NOTE_TITLE, NOTE_CONTENT) VALUES (?, ?, ?);",
                params: [book_id, title, content]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [userInformation.id, 'user', `User added a new note for ${name} (${title})`]
            },
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully added note ${title} for ${userInformation.email}'s book ${name} in the database!`);

        res.status(201).json({ message: `Successfully added note to book ${name} `});
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Delete a note for a book
export const deleteNote = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let resultQuery: any[];
        let error: AppError;
        const userInformation = req.user as IDecodedTokenPayload;
        const note_id = Number(req.params.note_id);
        const book_id = Number(req.params.book_id);
        const { name } = req.body as { name: string };

        console.log(`Processing deleteNote...`);

        // Ensure the parameter exists
        console.log(`Checking if ${userInformation.email}'s note id or book id and name exists in the parameters...`);
        if (!note_id || !book_id || !name) {
            error = new Error(`${userInformation.email} did not provide the note's id nor the book's name and id`);
            error.status = 404;
            error.frontend_message = "Missing the note's and book's identification number and book name";
            throw error;
        }
        console.log(`Found the note id (#${note_id}) and book id (#${book_id}) in ${userInformation.email}'s parameter and the book name (${name})!`);

        // Delete the note
        console.log(`Deleting note #${note_id} for ${userInformation.email}'s book ${name}`);
        transactionQuery = [
            {
                query: "DELETE FROM NOTE WHERE NOTE_ID = ? AND BOOK_ID = ?;",
                params: [note_id, book_id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [userInformation.id, 'user', `User deleted a note for book ${name}`]
            },
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully deleted note #${note_id} for ${userInformation.email}'s book ${name} in the database!`);

        res.status(200).json({ message: `Successfully deleted note from the book ${name}` });
        return;

    } catch (err: unknown) {
        next(err);
    }
}