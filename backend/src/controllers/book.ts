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
                params: [userInformation.id, 'user', `User successfully added book titled ${title}`
                ]
            },
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        bookId = resultQuery[0].insertId;
        console.log(`Successfully added the book (${title}) of ${userInformation.email} in the database!`);

        res.status(201).json({
            message: `Successfully added the book titled (${title})!`,
            book_id: bookId
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
        selectQuery = "SELECT BOOK_ID, BOOK_TITLE, BOOK_IMG FROM BOOK WHERE ACCT_ID = ? ORDER BY BOOK_LATEST_READ DESC;";
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