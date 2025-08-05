import e, { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { generateCode } from '../miscellaneous/generate-code';
import { neutralizeString } from '../miscellaneous/neutralize-string';
import { ITransactionQuery } from '../../types/types';
import { EmailConfiguration } from '../config/email';
import { LoginConfiguration } from '../config/login';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// Send a verification code to the user
export const sendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let accountInstance: { id: number, email: string };
        let { email } = req.body as { email: string };
        const verificationCode = generateCode(6);
        let emailInstance: EmailConfiguration;
        let transporter = nodemailer.createTransport(EmailConfiguration.systemEmail);
        const isLoggedIn = req.cookies['token'] ? true : false;

        console.log('Processing sendVerificationCode...');

        console.log('Checking if the user is currently logged in (has a valid token)...');
        if (isLoggedIn) {
            error = new Error("User has a valid token and possibly logged in; therefore, they can't continue with the password recovery process");
            error.status = 400;
            error.frontend_message = 'You must be logged out of your current account before you can reset your password'
            throw error;
        }
        console.log(`User is not logged in nor currently has a valid token. Success!`);

        console.log(`Checking if email exists...`);
        if (!email) {
            error = new Error(`Unable to find email in the request body`);
            error.status = 404;
            error.frontend_message = 'Email must exist before trying to reset your password'
            throw error;
        }
        console.log(`email (${email}) is found!`);

        // Find the email in the database
        console.log(`Checking the database if ${email} exists in the records...`);
        email = neutralizeString(email, true);
        selectQuery = "SELECT ACCT_ID, ACCT_EMAIL FROM ACCOUNT WHERE LOWER(ACCT_EMAIL) = LOWER(?);";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email]);
        if (resultQuery.length !== 1) {
            error = new Error(`Unable to find email ${email} in the database`);
            error.status = 404;
            error.frontend_message = 'Invalid Email!'
            throw error;
        }
        accountInstance = { id: resultQuery[0].ACCT_ID, email: resultQuery[0].ACCT_EMAIL }
        console.log(`Found ${accountInstance.email} in the database (user #${accountInstance.id})!`);

        // Store the verification code in the database
        console.log(`Storing ${accountInstance.email}'s verification code to the database...`);
        transactionQuery = [
            {
                query: "INSERT INTO VERIFICATION_CODE (ACCT_ID, CODE_CONTENT) VALUES (?, ?);",
                params: [accountInstance.id, verificationCode]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [accountInstance.id, 'user', 'User initiated a password recovery process']
            }
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully added the verification code for the user in the database!`);

        // Email the user's verification code to them
        console.log(`Sending the verification code to ${accountInstance.email}`);
        emailInstance = new EmailConfiguration(
            email, 
            "Password Recovery: Email Verification Code", 
            "html",
            `Your one time code is: <b>${verificationCode}</b><br />This code will expire in 10 minutes, so use it immediately to verify that you want to reset your password.` 
        );

        transporter.sendMail(emailInstance.getMailOptions(), (err, info) => {
            if (err) {
                error = new Error(`An mailer error occured while sending the code to the user...`);
                error.status = 500;
                error.frontend_message = "A server error occured with the mailer while sending the verification code to your email. Please try again";
                throw error;

            } else {
                console.log(`Successfully sent the verification code to the user's email`);
                res.status(201).json({ 
                    message: `Successfully sent the verification code to ${accountInstance.email}. Check your email for the code (You might have to check in your spam folder if possible)`,
                    email: accountInstance.email
                });
                return;
            }
        });

    } catch (err: unknown) {
        next(err);
    }
}

// Delete all existing verification codes for the user if the timer expires or they leave the page
export const cancelVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let selectQuery: string;
        let transactionQuery: ITransactionQuery[];
        let resultQuery: any[];
        let error: AppError;
        let acctId: number;
        let log: { type: 'user' | 'system', description: string, frontend_message: string };
        let { email, reason } = req.body as { email: string, reason: 'expire' | 'cancel' };

        console.log('Processing cancelVerificationCode...');

        console.log(`Checking if email exists...`);
        if (!email || !reason) {
            error = new Error(`Unable to find email or reason in the request body`);
            error.status = 404;
            error.frontend_message = 'Email and reason must exist before you can try to cancel your password recovery process...'
            throw error;
        }
        console.log(`email (${email}) is found!`);

        // Retrieve user's id
        console.log(`Retrieving ${email}'s account ID...`);
        selectQuery = "SELECT ACCT_ID FROM ACCOUNT WHERE LOWER(ACCT_EMAIL) = LOWER(?);";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email]);
        if (resultQuery.length !== 1) {
            error = new Error(`Unable to find email in the database`);
            error.status = 404;
            error.frontend_message = 'Email must exist in the records before you can try to cancel your password recovery process...'
            throw error;
        }
        acctId = resultQuery[0].ACCT_ID;
        console.log(`Found ${email}'s ID: #${acctId}`);

        // Delete all existing verification codes
        console.log(`Deleting all existing verification codes for ${email} with the reason of: ${reason}...`);
        log = {
            type: reason === 'expire' ? 'system' : 'user',
            description: reason === 'expire' ? 'Verification code expired during password recovery prcoess' : 'User cancelled the password recovery process',
            frontend_message: reason === 'expire' ? 'Current verification code expired. Please resend a new one' : 'Successfully cancelled password recovery process'
        }
        transactionQuery = [
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [acctId]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [acctId, log.type, log.description]
            }
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully deleted all existing verification codes for ${email}!`);
        
        res.status(200).json({
            message: log.frontend_message
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Resend a new verification code
export const resendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let { email } = req.body as { email: string };
        let accountInstance: { id: number, email: string };
        let error: AppError;
        let emailInstance: EmailConfiguration;
        let transporter = nodemailer.createTransport(EmailConfiguration.systemEmail);
        const verificationCode = generateCode(6);
        
        console.log('Processing resendVerificationCode...');

        console.log(`Checking if email exists...`);
        if (!email) {
            error = new Error(`Unable to find email in the request body`);
            error.status = 404;
            error.frontend_message = 'Email must exist before you can resend a new verification code...'
            throw error;
        }
        console.log(`email (${email}) is found!`);

        // Find the user from the database
        console.log(`Checking user ${email}'s records in the database...`);
        email = neutralizeString(email, true);
        selectQuery = "SELECT ACCT_ID, ACCT_EMAIL FROM ACCOUNT WHERE LOWER(ACCT_EMAIL) = LOWER(?);";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email]);
        if (resultQuery.length !== 1) {
            error = new Error(`Unable to find ${email} in the database...`);
            error.status = 404;
            error.frontend_message = 'Unable to find your records in the system. Please contact the admin'
            throw error;
        }
        accountInstance = { id: resultQuery[0].ACCT_ID, email: resultQuery[0].ACCT_EMAIL }
        console.log(`Found ${accountInstance.email} in the database records (#${accountInstance.id})!`);

        // Replace old verification codes of the user with the new one
        console.log(`Replacing old verification codes with the new one for ${email}...`);
        transactionQuery = [
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [accountInstance.id]
            },
            {
                query: "INSERT INTO VERIFICATION_CODE (ACCT_ID, CODE_CONTENT) VALUES (?, ?);",
                params: [accountInstance.id, verificationCode]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [accountInstance.id, 'user', 'User resent a new verification code']
            }
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully made a new verification code for ${email}!`);

        // Send the new verification code to the user's email
        console.log(`Sending the new verification code to ${accountInstance.email}`);
        emailInstance = new EmailConfiguration(
            email, 
            "Password Recovery: New Verification Code", 
            "html",
            `Your new one time code is: <b>${verificationCode}</b><br />This code will expire in 10 minutes, so use it immediately to verify that you want to reset your password.` 
        );

        transporter.sendMail(emailInstance.getMailOptions(), (err, info) => {
            if (err) {
                error = new Error(`A mailer error occured while sending the code to the user...`);
                error.status = 500;
                error.frontend_message = "A server error occured with the mailer while sending the verification code to your email. Please try again";
                throw error;

            } else {
                console.log(`Successfully sent the new verification code to ${email}!`);
                res.status(201).json({ 
                    message: `Successfully sent the new verification code to ${accountInstance.email}. Check your email for the code (You might have to check in your spam folder if possible)`
                });
                return;
            }
        });


    } catch (err: unknown) {
        next(err);
    }
}

// Verify the given verification code
export const verifyVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let accountInstance: { id: number, email: string };
        let { email, verification_code } = req.body as { email: string, verification_code: string };
        let error: AppError;

        console.log('Processing verifyVerificationCode...');

        console.log(`Checking if email and verification code exist...`);
        if (!email) {
            error = new Error(`Unable to find email and verification code in the request body`);
            error.status = 404;
            error.frontend_message = 'Email and verification code must exist before you can verify the code...'
            throw error;
        }
        console.log(`email (${email}) and verification code is found!`);

        // Compare the provided verification code to the one in the database
        email = neutralizeString(email, true);
        console.log(`Comparing ${email}'s given verification code to the one in the database...`);
        selectQuery = `SELECT A.ACCT_ID, ACCT_EMAIL, CODE_CONTENT
                        FROM ACCOUNT A
                        JOIN VERIFICATION_CODE C
                        ON A.ACCT_ID = C.ACCT_ID
                        WHERE ACCT_EMAIL = ?
                        AND CODE_CONTENT = ?
                        AND CODE_CREATED < CODE_EXPIRATION;`
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email, verification_code]);
        
        if (resultQuery.length !== 1) {
            error = new Error(`${email}'s given verification code (${verification_code}) does not match the one stored in the database`);
            error.status = 400;
            error.frontend_message = 'Invalid verification code'
            throw error;
        }
        accountInstance = { id: resultQuery[0].ACCT_ID, email: resultQuery[0].ACCT_EMAIL };
        console.log(`${accountInstance.email}'s provided verification code (${verification_code}) matches the valid one in the database!`);

        // Delete all verification codes
        console.log(`Deleting all existing verification codes for ${accountInstance.email}...`);
        transactionQuery = [
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [accountInstance.id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    accountInstance.id,
                    'user',
                    'User successfully verified their email during password recovery'
                ]
            }
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully deleted all existing verification codes for ${accountInstance.email}!`);

        console.log(`${accountInstance.email} successfully passed the verification process for password-recovery!`);
        res.status(200).json({ message: "Email verified. You can now change your password" });
        return;

    } catch (err: unknown) {
        next(err);
    }

}

// Change user's password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let selectQuery: string;
        let transactionQuery: ITransactionQuery[];
        let resultQuery: any[];
        let error: AppError;
        let accountInstance: { id: number, email: string };
        let { email, password } = req.body as { email: string, password: string };

        console.log('Processing changePassword...');

        console.log(`Checking if email and password exist...`);
        if (!email || !password) {
            error = new Error(`Unable to find email and password in the request body`);
            error.status = 404;
            error.frontend_message = 'Email and password  must exist before you can change your password'
            throw error;
        }
        console.log(`email (${email}) and password is found!`);

        // Ensure password rule is still followed and not bypassed in the frontend
        email = neutralizeString(email, true);
        console.log(`Checking if ${email} password is still valid...`);
        if (!LoginConfiguration.passwordRegex.test(password)) {
            error = new Error(`User provided a weak password`);
            error.status = 400;
            error.frontend_message = "Your password must contain at least one upper case and lowercase letters, one number, and one special character.";
            throw error;
        }
        console.log(`${email} password is valid!`);

        // Hash user password
        console.log(`Hashing the ${email}'s password...`);
        password = await bcrypt.hash(password, 10);
        console.log(`Successfully hashed the ${email}'s password`);

        // Retrieve the user's ID 
        console.log(`Retreiving ${email}'s database ID...`);
        selectQuery = "SELECT ACCT_ID, ACCT_EMAIL FROM ACCOUNT WHERE LOWER(ACCT_EMAIL) = LOWER(?);";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email]);
        if (resultQuery.length !== 1) {
            error = new Error(`Unable to find email ${email} in the database`);
            error.status = 404;
            error.frontend_message = 'Invalid Email!'
            throw error;
        }
        accountInstance = { id: resultQuery[0].ACCT_ID, email: resultQuery[0].ACCT_EMAIL }
        console.log(`Found ${accountInstance.email} in the database (user #${accountInstance.id})!`);

        // Update the user's password
        console.log(`Changing ${email}'s password in the database...`);
        transactionQuery = [
            {
                query: "UPDATE ACCOUNT SET ACCT_PASSWORD = ? WHERE ACCT_ID = ?;",
                params: [password, accountInstance.id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [accountInstance.id, 'user', 'User successfully changed their password']
            }
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully changed ${email}'s password in the database...`);

        res.status(200).json({ message: `Password change success!`});
        return;

    } catch (err: unknown) {
        next(err);
    }
}