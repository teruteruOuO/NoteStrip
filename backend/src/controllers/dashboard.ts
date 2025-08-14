import { Request, Response, NextFunction } from 'express';
import { AppError, IDecodedTokenPayload } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { PersonalS3Bucket } from '../config/s3-bucket';

// Retrieve the number of times a user has read books each day within the last given days
export const retrieveReadActivity = async (req: Request, res: Response, next: NextFunction) => {
    try {
        type ReadActivity = { day_label: string, day_date: string, read_count: number };
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let readActivity: ReadActivity[];
        const userInformation = req.user as IDecodedTokenPayload;
        const days = parseInt(req.query.days as string) || 1;       /* ?days=... (defaults to 1) */

        console.log('Processing retrieveReadActivity...');

        console.log(`Checking if ${userInformation.email} provided the number of days in the request query...`);
        if (!days) {
            error = new Error(`${userInformation.email} did not provide the number of days`);
            error.status = 404;
            error.frontend_message = "Please provide the number of days";
            throw error;
        }
        console.log(`${userInformation.email} provided the number of days (${days})!`);

        // Retrieve the number of times a user has read books each day within the last given days
        console.log(`Retrieving ${userInformation.email}'s book activity from the database...`);
        selectQuery = `WITH RECURSIVE last_n_days AS (
                        SELECT CURDATE() AS d
                        UNION ALL
                        SELECT d - INTERVAL 1 DAY FROM last_n_days
                        WHERE d > CURDATE() - INTERVAL ? DAY
                    )
                    SELECT
                    DATE_FORMAT(dts.d, '%b %e') AS day_label,
                    dts.d                        AS day_date,
                    COALESCE(cnt.read_count, 0)  AS read_count
                    FROM last_n_days AS dts
                    LEFT JOIN (
                        SELECT DATE(BRA.BR_ACTIVITY_LATEST_READ) AS d, COUNT(*) AS read_count
                        FROM BOOK AS B
                        JOIN BOOK_READ_ACTIVITY AS BRA ON BRA.BOOK_ID = B.BOOK_ID
                        WHERE B.ACCT_ID = ?
                            AND BRA.BR_ACTIVITY_LATEST_READ >= CURDATE() - INTERVAL ? DAY
                        GROUP BY DATE(BRA.BR_ACTIVITY_LATEST_READ)
                    ) AS cnt
                    ON cnt.d = dts.d
                    ORDER BY dts.d;`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [days, userInformation.id, days]);
        if (resultQuery.length <= 0) {
            error = new Error(`${userInformation.email}'s ID does not exist in the databse (Should never happen)`);
            error.status = 400;
            error.frontend_message = "Invalid user";
            throw error;
        }

        readActivity = resultQuery.map(activity => {
            return {
                day_label: activity.day_label,
                day_date: activity.day_date,
                read_count: activity.read_count,
            }
        });

        console.log(`Successfully retrieved ${userInformation.email}'s book activity!`);

        res.status(200).json({
            message: `Successfully retrieved book read activity within the last ${days} days`,
            read_activity: readActivity
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Retrieve the user's Top [number] books based on the amount of times read
export const retrieveTopReadBooks = async (req: Request, res: Response, next: NextFunction) => {
    try {
        type Books = { id: number, title: string, image_source: string, read_count: number }
        let selectQuery: string;
        let resultQuery: any[];
        let books: Array<Books> = []; // initialize as []
        let error: AppError;
        const userInformation = req.user as IDecodedTokenPayload;
        const limit = parseInt(req.query.limit as string) || 1;       

        console.log('Processing retrieveTopReadBooks...');

        // Ensure limit is in the request parameter
        console.log(`Checking if ${userInformation.email} provided the limit in the request query...`);
        if (!limit) {
            error = new Error(`${userInformation.email} did not provide the limit`);
            error.status = 404;
            error.frontend_message = "A limit must be provided";
            throw error;
        }
        console.log(`${userInformation.email} provided the number of limits (${limit})!`);

        // Ensure limit is only between 1 and 10
        console.log(`Checking if ${userInformation.email}'s limit (${limit}) is between 1 and 10 only`);
        if (limit < 1 || limit > 10) {
            error = new Error(`${userInformation.email}'s limit is NOT between 1 and 10`);
            error.status = 400;
            error.frontend_message = "Top books cannot be less than 1 or greater than 10";
            throw error;
        }
        console.log(`${userInformation.email}'s limit (${limit}) is between 1 and 5!`);

        // Retrieve all of the user's books
        console.log(`Retrieving ${userInformation.email}'s top ${limit} books...`);
        selectQuery = `SELECT B.BOOK_ID, BOOK_TITLE, BOOK_IMG, COUNT(B.BOOK_ID) AS READ_COUNT
                        FROM BOOK B 
                        JOIN BOOK_READ_ACTIVITY BRA 
                        ON B.BOOK_ID = BRA.BOOK_ID
                        WHERE ACCT_ID = ?
                        GROUP BY B.BOOK_ID
                        ORDER BY READ_COUNT DESC
                        LIMIT ?;`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [userInformation.id, limit]);
        console.log(`Successfully retrieved ${userInformation.email}'s top ${limit} books!`);

        if (resultQuery.length > 0) {
            books = await Promise.all(
                resultQuery.map(async (book: any): Promise<Books> => ({
                    id: book.BOOK_ID,
                    title: book.BOOK_TITLE,
                    image_source: await PersonalS3Bucket.RetrieveImageUrl(book.BOOK_IMG),
                    read_count: book.READ_COUNT
                }))
            );
        }

        res.status(200).json({
            message: `Successfully retrieved your top ${limit} books`,
            books: books
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}