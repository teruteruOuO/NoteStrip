import { Request, Response, NextFunction } from 'express';
import { AppError, IDecodedTokenPayload, ITransactionQuery } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { LoginConfiguration } from '../config/login';
import { neutralizeString } from '../miscellaneous/neutralize-string';
import { generateCode } from '../miscellaneous/generate-code';
import { EmailConfiguration } from '../config/email';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Retrieve Email (Email should be stored from the token)
export const retrieveEmail = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let error: AppError;
        const currentToken = req.user as IDecodedTokenPayload;
        console.log(`Processing retrieveEmail...`);

        console.log(`Retrieving user email from the token...`);
        if (!currentToken.email) {
            error = new Error("User email is missing from the token");
            error.status = 401;
            error.frontend_message = "Invalid request";
            throw error;
        }
        console.log(`Successfully retrieved email ${currentToken.email} from the user's token!`);

        res.status(200).json({
            email: currentToken.email,
            message: `Successfully retrieved email`
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Change Email (Step 1): Send verification code to the user's new email and also store it to the database
export const sendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let userInformation = req.user as IDecodedTokenPayload;
        let emailInstance: EmailConfiguration;
        let transporter = nodemailer.createTransport(EmailConfiguration.systemEmail);
        let { new_email } = req.body as { new_email: string }
        const verificationCode = generateCode(6);

        console.log(`Processing sendVerificationCode (Change Email)...`);

        console.log(`Checking if new email is in the request body...`);
        if (!new_email) {
            error = new Error("New email is missing from the request body");
            error.status = 404;
            error.frontend_message = "You must provide the new email";
            throw error;
        }
        console.log(`Found the email (${new_email})!`);

        // Check if the given email already exists
        console.log(`Checking to see if the new email is already taken...`);
        new_email = neutralizeString(new_email, true);
        selectQuery = "SELECT ACCT_EMAIL FROM ACCOUNT WHERE LOWER(ACCT_EMAIL) = LOWER(?);";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [new_email]);
        if (resultQuery.length >= 1) {
            error = new Error(`User (${userInformation.email} #${userInformation.id}) requesting to change their email to ${new_email} failed because ${new_email} already exists in the records`);
            error.status = 400;
            error.frontend_message = "Email taken";
            throw error;
        }
        console.log(`Seems like ${new_email} hasn't been taken yet. Success!`);

        // Store the verification code to the user's account
        console.log(`Storing the verification code to the user's account...`);
        transactionQuery = [
            {
                query: 'DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;',
                params: [userInformation.id]
            },
            {
                query: 'INSERT INTO VERIFICATION_CODE (ACCT_ID, CODE_CONTENT) VALUES (?, ?);',
                params: [userInformation.id, verificationCode]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    userInformation.id,
                    'user',
                    'User initiated a change email process'
                ]
            }
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully stored the verification code to the user's account!`);

        // Send the verification code to the user's new email
        console.log(`Sending the verification code to the user's new email address: ${new_email}`);
        emailInstance = new EmailConfiguration(
            new_email, 
            "Account: Change Email Verification Code", 
            "html",
            `Your one time code is: <b>${verificationCode}</b><br />This code will expire in 10 minutes, so use it immediately to verify your new email address.` 
        );

        transporter.sendMail(emailInstance.getMailOptions(), (err, info) => {
            if (err) {
                error = new Error(`A mailer error occured while sending the code to the user's new email (${new_email})...`);
                error.status = 500;
                error.frontend_message = "A server error occured with the mailer while sending the verification code to your email. Please try again";
                throw error;

            } else {
                console.log(`Successfully sent the verification code to the user's new email (${new_email})`);
                res.status(200).json({ 
                    message: `Successfully sent the verification code to ${new_email}. Check your email for the code (You might have to check in your spam folder if possible)`,
                    email: new_email
                });
                return;
            }
        });

    } catch (err: unknown) {
        next(err);
    }
}

// Change Email (Step: Timer expires or user cancels the process): Triggers when the timer reaches 00:00
export const cancelChangeEmailProcess = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let resultQuery: any[];
        let userInformation = req.user as IDecodedTokenPayload
        let { reason } = req.body as { reason: 'expire' | 'cancel' }
        let databaseLog: {
            type: 'system' | 'user',
            description: string,
            frontend_message: string
        }
        let error: AppError;

        console.log(`Processing cancelChangeEmailProcess (Change Email)...`);

        // Ensure a reason exists
        console.log(`Checking if a reason exists in the request body`);
        if (!reason) {
            error = new Error("User did not provide a reason for cancelling email process");
            error.status = 404;
            error.frontend_message = "A reason must be provided";
            throw error;
        }
        console.log(`Reason found for cancelling the change email process (${reason})`);

        // Delete all existing verification code for the user
        console.log(`Removing all verification codes for user ${userInformation.email} (#${userInformation.id})`);
        databaseLog = {
            type: reason === 'expire' ? 'system' : 'user',
            description: reason === 'expire' ? "Verification code expired during the change email process" : "User cancelled their change email process",
            frontend_message: reason === 'expire' ? "Verification code expired. Please resend a new one" : "Successfully cancelled change email process"
        }
        transactionQuery = [
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [userInformation.id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    userInformation.id,
                    databaseLog.type,
                    databaseLog.description
                ]
            }
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully deleted all verification codes for user ${userInformation.email} because of this reason: ${reason}`);

        res.status(200).json({ message: databaseLog.frontend_message });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Change Email (Step: Resend a new verification code)
export const resendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let { new_email } = req.body as { new_email: string };
        let userInformation = req.user as IDecodedTokenPayload;
        let emailInstance: EmailConfiguration;
        let transporter = nodemailer.createTransport(EmailConfiguration.systemEmail);
        const verificationCode = generateCode(6);

        console.log(`Processing resendVerificationCode (Change Email)...`);

        // Ensure a new email exists in the request body
        console.log(`Checking if a new email exists in the request body`);
        if (!new_email) {
            error = new Error("User did not provide the new email in the request body");
            error.status = 404;
            error.frontend_message = "The new email must be provided";
            throw error;
        }
        console.log(`New email found (${new_email})!`);

        // Check and see if the new email is still not taken
        new_email = neutralizeString(new_email, true);
        console.log(`Checking to see if ${new_email} is still not taken...`);
        selectQuery = "SELECT ACCT_EMAIL FROM ACCOUNT WHERE LOWER(ACCT_EMAIL) = LOWER(?);";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [new_email]);
        if (resultQuery.length >= 1) {
            error = new Error(`Seems like ${new_email} is already taken`);
            error.status = 400;
            error.frontend_message = `Email ${new_email} is already taken. Please try a new one.`;
            throw error;
        }
        console.log(`Email ${new_email} is still not taken. Success!`);

        // Store the verification code to the user's account
        console.log(`Storing the new verification code to the user's account...`);
        transactionQuery = [
            {
                query: 'DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;',
                params: [userInformation.id]
            },
            {
                query: 'INSERT INTO VERIFICATION_CODE (ACCT_ID, CODE_CONTENT) VALUES (?, ?);',
                params: [userInformation.id, verificationCode]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    userInformation.id,
                    'user',
                    'User resent a new verification code during email change process'
                ]
            }
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully stored the new verification code to the user's account!`);

        // Send the verification code to the user's new email
        console.log(`Sending the new verification code to the user's new email address: ${new_email}`);
        emailInstance = new EmailConfiguration(
            new_email, 
            "Account: Change Email Resend Verification Code", 
            "html",
            `Your new one time code is: <b>${verificationCode}</b><br />This code will expire in 10 minutes, so use it immediately to verify your new email address.` 
        );

        transporter.sendMail(emailInstance.getMailOptions(), (err, info) => {
            if (err) {
                error = new Error(`A mailer error occured while sending the code to the user's new email (${new_email})...`);
                error.status = 500;
                error.frontend_message = "A server error occured with the mailer while sending the verification code to your email. Please try again";
                throw error;

            } else {
                console.log(`Successfully resent the new verification code to the user's new email (${new_email})`);
                res.status(200).json({ 
                    message: `Successfully resent the new verification code to ${new_email}. Check your email for the code (You might have to check in your spam folder if possible)`,
                    email: new_email
                });
                return;
            }
        });

    } catch (err: unknown) {
        next(err);
    }
}

// Change Email (Step 2: Verify the provided verification code)
export const verifyVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let nickname: string;
        let error: AppError;
        let userInformation = req.user as IDecodedTokenPayload;
        let newToken: string;
        let loginInstance: LoginConfiguration;
        let { new_email, verification_code } = req.body as { new_email: string, verification_code: string };

        console.log(`Processing verifyVerificationCode (Change Email)...`);

        // Ensure a new email and verification code exist in the request body
        console.log(`Checking if new email and verification code exist in the request body`);
        if (!new_email) {
            error = new Error("User did not provide either the new email or verification code in the request body");
            error.status = 404;
            error.frontend_message = "The new email and verification code must be provided";
            throw error;
        }
        console.log(`New email (${new_email}) and verification code found!!`);

        // Compare the provided verification code to the one in the database
        console.log(`Comparing ${userInformation.email}'s given verification code to the one in the database...`);
        selectQuery = `SELECT A.ACCT_ID, ACCT_EMAIL, CODE_CONTENT
                        FROM ACCOUNT A
                        JOIN VERIFICATION_CODE C
                        ON A.ACCT_ID = C.ACCT_ID
                        WHERE ACCT_EMAIL = ?
                        AND CODE_CONTENT = ?
                        AND CODE_CREATED < CODE_EXPIRATION;`
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [userInformation.email, verification_code]);

        if (resultQuery.length !== 1) {
            error = new Error(`${userInformation.email}'s given verification code ${verification_code} does not match the one stored in the database`);
            error.status = 400;
            error.frontend_message = 'Invalid verification code'
            throw error;
        }
        console.log(`${userInformation.email}'s provided verification code (${verification_code}) matches the valid one in the database!`);

        // Update the user's email in the database
        new_email = neutralizeString(new_email, true);
        nickname = new_email.split("@")[0] // takes the string before the @ from the email
        console.log(`Updating user ${userInformation.email}'s email to ${new_email} in the database...`);
        transactionQuery = [
            {
                query: "UPDATE ACCOUNT SET ACCT_EMAIL = ?, ACCT_NICKNAME = ? WHERE ACCT_ID = ?;",
                params: [new_email, nickname, userInformation.id]
            },
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [userInformation.id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    userInformation.id,
                    'user',
                    'User successfully verified their new email'
                ]
            }
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully updated user ${userInformation.email}'s email to ${new_email}!`);

        // Update login (token) configuration
        console.log(`Configuring a new login token for ${new_email} (previously ${userInformation.email})...`);
        newToken = jwt.sign(
            { 
                id: userInformation.id, 
                email: new_email 
            }, 
            LoginConfiguration.jwtSecret, 
            { expiresIn: '8h' }
        );
        loginInstance = new LoginConfiguration();
        res.cookie('token', newToken, loginInstance.getLoginOptions());
        console.log(`Successfully configured ${new_email}'s (previously ${userInformation.email}) new login token...`);

        res.status(200).json({
            message: `Successfully updated email address!`,
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Change password
export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let selectQuery: string;
        let transactionQuery: ITransactionQuery[];
        let resultQuery: any[];
        let { old_password, new_password } = req.body as { old_password: string, new_password: string };
        let databasePassword: string;
        let isPasswordValid: boolean;
        let userInformation = req.user as IDecodedTokenPayload;
        let error: AppError;

        console.log(`Processing verifyVerificationCode...`);

        // Ensure old and new passwords are in the request body
        console.log(`Checking if old and new passwords are in the request body...`);
        if (!old_password || !new_password) {
            error = new Error(`${userInformation.email} did not provide old and new passwords in the request body`);
            error.status = 404;
            error.frontend_message = "Old and new passwords must be in the request body";
            throw error;
        }
        console.log(`Old and new passwords are found!`);

        // Ensure password rule is still followed by the new password and not bypassed in the frontend
        console.log(`Checking if ${userInformation.email}'s new password is still valid...`);
        if (!LoginConfiguration.passwordRegex.test(new_password)) {
            error = new Error(`${userInformation.email} provided a weak password`);
            error.status = 400;
            error.frontend_message = "Your password must contain at least one upper case and lowercase letters, one number, and one special character.";
            throw error;
        }
        console.log(`${userInformation.email}'s new password is valid!`);

        // Retrieve the old password from the database
        console.log(`Retrieving ${userInformation.email}'s current password from the database...`);
        selectQuery = "SELECT ACCT_PASSWORD FROM ACCOUNT WHERE ACCT_ID = ?;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [userInformation.id]);
        if (resultQuery.length !== 1) {
            error = new Error(`${userInformation.email}'s password cannot be found in the database`);
            error.status = 404;
            error.frontend_message = "Unable to retrieve your password. Please contact the admin immediately";
            throw error;
        }
        databasePassword = resultQuery[0].ACCT_PASSWORD;
        console.log(`Successfully retrieved ${userInformation.email}'s current password!`);

        // Compare the old password to the one in the database
        console.log(`Comparing ${userInformation.email}'s old password to the one in the database...`);
        isPasswordValid = await bcrypt.compare(old_password, databasePassword);
        console.log(`Password validation result for ${userInformation.email}: ${isPasswordValid}`);

        databasePassword = "";
        if (!isPasswordValid) {
            error = new Error(`Given password does not match the database password. Cannot proceed with the login process.`);
            error.status = 400;
            error.frontend_message = "Incorrect Password!";
            throw error;
        }
        console.log(`Passwords match!`);

        // Hash the new password
        console.log(`Hashing the ${userInformation.email}'s new password...`);
        new_password = await bcrypt.hash(new_password, 10);
        console.log(`Successfully hashed ${userInformation.email}'s new password`);

        // Update user's password in the database and then log the action
        console.log(`Updating ${userInformation.email}'s password in the database...`);
        transactionQuery = [
            {
                query: "UPDATE ACCOUNT SET ACCT_PASSWORD = ? WHERE ACCT_ID = ?;",
                params: [new_password, userInformation.id]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    userInformation.id,
                    'user',
                    'User successfully updated their password'
                ]
            },
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`${userInformation.email} successfully updated their password!`);

        res.status(200).json({ message: `Password change success!` });
        return;

    } catch (err: unknown) {
        next(err);
    }

}

// Retrieve activity logs for a user with pagination
export const retrieveActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let selectQuery: string;
        let resultQuery: any[];
        let userInformation = req.user as IDecodedTokenPayload;
        let activityLogs: { 
            id: number, 
            type: `user` | `system`,
            description: string,
            timestamp: string
        }[];
        let error: AppError;
        let totalLogs: number;
        const logsPerPage = 30;                                     // page size
        const page = parseInt(req.query.page as string) || 1;       /* ?page=... (defaults to 1) */
        const offset = (page - 1) * logsPerPage;                    // how many rows to skip

        console.log(`Processing retrieveActivityLogs...`);
        console.log(`Retrieving page ${page} of ${userInformation.email}'s activity logs...`);

        // Total log count for pagination (Count total rows for page count)
        console.log(`Determining the total log count for ${userInformation.email}'s pagination...`);
        selectQuery = "SELECT COUNT(*) AS total FROM ACTIVITY_LOG WHERE ACCT_ID = ?;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [userInformation.id]);
        if (resultQuery.length <= 0) {
            error = new Error(`Unable to determine ${userInformation.email}'s total log count for pagination`);
            error.status = 404;
            error.frontend_message = "Unable to find activity logs";
            throw error;
        }
        totalLogs = resultQuery[0]?.total || 0;
        console.log(`Successfully determined ${userInformation.email}'s total log count for pagination: ${totalLogs}`);

        // Retrieve activity logs (Fetch just one page)
        console.log(`Retrieving ${userInformation.email}'s activity logs from the database...`);
        selectQuery = `SELECT 
                        LOG_ID, 
                        LOG_TYPE, 
                        LOG_DESCRIPTION, 
                        DATE_FORMAT(LOG_TIMESTAMP, '%l:%i %p %M %e, %Y') AS LOG_TIMESTAMP
                    FROM ACTIVITY_LOG 
                    WHERE ACCT_ID = ? 
                    ORDER BY LOG_ID DESC 
                    LIMIT ? OFFSET ?;`;
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [userInformation.id, logsPerPage, offset]);
        if (resultQuery.length <= 0) {
            error = new Error(`Unable to find ${userInformation.email}'s activity logs`);
            error.status = 404;
            error.frontend_message = "Unable to find activity logs";
            throw error;
        }
        console.log(`Found ${userInformation.email}'s activity logs!`);

        // Store this in activitylogs array
        activityLogs = resultQuery.map(log => {
            return {
                id: log.LOG_ID,
                type: log.LOG_TYPE,
                description: log.LOG_DESCRIPTION,
                timestamp: log.LOG_TIMESTAMP
            }
        });

        // Respond with data + pagination metadata
        /* 
        The count gives you total pages; 
        LIMIT/OFFSET returns only the slice you need; 
        The response bundles both the data and the “pager math” so the frontend can render controls.
        */
        res.status(200).json({
            message: `Successfully retrieved activity logs (Page ${page} of ${Math.ceil(totalLogs / logsPerPage)})`,
            activity_logs: activityLogs,
            total_logs: totalLogs,
            total_pages: Math.ceil(totalLogs / logsPerPage),
            current_page: page
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}