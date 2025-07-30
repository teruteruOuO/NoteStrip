import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types/types';

export const errorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    console.error({ err }, err.message);

    // SQL Related Errors
    if (err.sqlMessage) {

        // Cancel verification if email does not have a proper format
        if (err.sqlMessage.includes('CHK_ACCT_EMAIL')) {
            console.error('User provided an invalid email format');
            res.status(400).json({ message: 'Invalid email format.' });
            return;
        }

        // Cancel verification if email is already taken
        if (err.code && err.code.includes('ER_DUP_ENTRY') && err.sqlMessage.includes('ACCT_EMAIL')) {
            console.error('User provided an email that already exists in the database');
            res.status(409).json({ message: 'Email is already taken.' });
            return;
        }
    }

    res.status(err.status || 500).json({ message: err.frontend_message || 'Internal Server Error' });
    return;
};
