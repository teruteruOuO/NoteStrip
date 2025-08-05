import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { generateCode } from '../miscellaneous/generate-code';
import { neutralizeString } from '../miscellaneous/neutralize-string';
import { ITransactionQuery } from '../../types/types';
import { EmailConfiguration } from '../config/email';
import { LoginConfiguration } from '../config/login';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

// Triggers when user signs up
export const signupUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let deleteQuery: string;
        let insertQuery: string;
        let resultQuery: any[];
        let { email, password } = req.body as { email: string, password: string }
        let nickname: string;
        let acctId: number;
        let error: AppError;
        const verificationCode = generateCode(6);
        const isLoggedIn = req.cookies['token'] ? true : false;
        let emailInstance: EmailConfiguration;
        let transporter = nodemailer.createTransport(EmailConfiguration.systemEmail);

        console.log(`Processing signupUser...`);

        console.log(`Checking if user is currently logged in...`);
        if (isLoggedIn) {
            error = new Error("User has a valid token and possibly logged in; therefore, they can't continue with the sign-up process");
            error.status = 400;
            error.frontend_message = 'You must be logged out before you can create a new account.'
            throw error;
        }
        console.log(`User is not logged in nor currently has valid token. Success!`);

        console.log(`Checking if email and password exist...`);
        if (!email || !password) {
            error = new Error(`Unable to find email or password in the request body`);
            error.status = 404;
            error.frontend_message = 'Email and password must exist before verifying your code'
            throw error;
        }
        console.log(`email (${email}) and password are found!`);

        // Neutralize email
        console.log(`Neutralizing email and setting up user nickname...`);
        email = neutralizeString(email, true);
        nickname = email.split("@")[0] // takes the string before the @ from the email
        console.log(`Successfully neutralized user's email and set up their nickname!`);
        console.log(`Email: ${email}; Nickname: ${nickname}`);

        // Ensure password rule is still followed and not bypassed in the frontend
        console.log(`Checking if user password is still valid...`);
        if (!LoginConfiguration.passwordRegex.test(password)) {
            error = new Error(`User provided a weak password`);
            error.status = 400;
            error.frontend_message = "Your password must contain at least one upper case and lowercase letters, one number, and one special character.";
            throw error;
        }
        console.log(`User's password is valid!`);

        // Hash user password
        console.log(`Hashing the user's password...`);
        password = await bcrypt.hash(password, 10);
        console.log(`Successfully hashed the user's password`);

        // Insert user information to the database
        console.log(`Adding user's information to the database...`);
        transactionQuery = [
            {
                query: "INSERT INTO ACCOUNT (ACCT_EMAIL, ACCT_PASSWORD, ACCT_NICKNAME) VALUES (?, ?, ?);",
                params: [email, password, nickname]
            },
            {
                query: 'SET @user_id = LAST_INSERT_ID();',
                params: []
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (@user_id, ?, ?);",
                params: [
                    'user',
                    'User signed up to the system'
                ]
            },
            {
                query: "INSERT INTO VERIFICATION_CODE (ACCT_ID, CODE_CONTENT) VALUES (@user_id, ?);",
                params: [verificationCode]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (@user_id, ?, ?);",
                params: [
                    'system',
                    'System has created a verification code for the user'
                ]
            },
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        acctId = resultQuery[0].insertId; // Store the user's account id
        console.log(`Succesfully added the user's information to the database! ${nickname}'s account ID is #${acctId}`);

        // Set up email configuration for the user and send the verification code to the user's email
        console.log(`Sending the verification code to the user's email address: ${email}`);
        emailInstance = new EmailConfiguration(
            email, 
            "Sign-up: Email Verification Code", 
            "html",
            `Your one time code is: <b>${verificationCode}</b><br />This code will expire in 10 minutes, so use it immediately to verify your email address.` 
        );

        transporter.sendMail(emailInstance.getMailOptions(), async (err, info) => {
            if (err) {
                error = new Error(`An error occured while sending the code to the user. Deleting the user instance with the email ${email}`);

                deleteQuery = "DELETE FROM ACCOUNT WHERE ACCT_EMAIL = ?;";
                resultQuery = await DatabaseScript.executeWriteQuery(deleteQuery, [email]);
                console.log(`Successfully deleted user with the email ${email}`);

                error.status = 500;
                error.frontend_message = "A server error occured with the mailer while sending the code to your email. Please try again";
                throw error;

            } else {
                // Log successful code sent action to the databsase
                insertQuery = "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);"
                resultQuery = await DatabaseScript.executeWriteQuery(insertQuery, [acctId, "system", "System successfully sent a verification code to the user's email"]);

                console.log(`Successfully sent the verification code to the user's email`);
                res.status(201).json({ 
                    message: `Successfully sent the verification code to ${email}. Check your email for the code (You might have to check in your spam folder if possible)`,
                    email: email
                });
                return;
            }
        });

    } catch (err: unknown) {
        next(err);
    }
}

// Triggers when the user attempts to reload/tab out of the website, go to another route of the website, or reset their sign up process
export const resetSignupProcess = async (req: Request, res: Response, next: NextFunction) => { 
    try {
        let deleteQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let { email, reason } = req.body as { email: string, reason: string };

        console.log("processing resetSignupProcess...");

        console.log(`Checking if an email exist...`);
        if (!email) {
            error = new Error(`Unable to find email in the request body `);
            error.status = 404;
            error.frontend_message = 'An email must exist before reseting the sign-up process'
            throw error;
        }
        console.log(`${email} email is found!`);

        // Delete the user's account
        console.log(`Deleting ${email} due to reason: ${reason}`);
        deleteQuery = "DELETE FROM ACCOUNT WHERE ACCT_EMAIL = ? AND ACCT_VERIFIED = ? AND ACCT_ACTIVE = ?;";
        resultQuery = await DatabaseScript.executeWriteQuery(deleteQuery, [email, 'no', 'no']);
        console.log(`Successfully removed ${email}'s account from the database`);

        res.status(200).json({
            message: `Successfully removed ${email}'s account.`
        });
        return;
    } catch (err: unknown) {
        next(err);
    }
}

// Resend a new verification code to the user
export const resendVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let insertQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let { email } = req.body as { email: string }
        let acctId: number;
        let emailInstance: EmailConfiguration;
        let transporter = nodemailer.createTransport(EmailConfiguration.systemEmail);
        const verificationCode = generateCode(6);

        console.log("processing resendVerificationCode...");

        console.log(`Checking if an email exist...`);
        if (!email) {
            error = new Error(`Unable to find email in the request body`);
            error.status = 404;
            error.frontend_message = 'An email must exist before resending a new verification code'
            throw error;
        }
        console.log(`${email} email is found!`);

        // Retrieve the user's id
        console.log(`Retrieving ${email}'s account ID from the database...`);
        selectQuery = "SELECT ACCT_ID FROM ACCOUNT WHERE ACCT_EMAIL = ?;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email]);

        if (resultQuery.length !== 1) {
            error = new Error(`Unable to find ${email} in the database`);
            error.status = 404;
            error.frontend_message = `${email} does not exist. Please try signing up again.`
            throw error;
        }
        acctId = resultQuery[0].ACCT_ID;
        console.log(`${email} found! Their account ID is #${acctId}`);

        // Delete all exisiting verification code for the user then make a new one
        console.log(`Resending a new verification code (${verificationCode}) to ${email}...`);
        transactionQuery = [
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [acctId]
            },
            {
                query: "INSERT INTO VERIFICATION_CODE (ACCT_ID, CODE_CONTENT) VALUES (?, ?);",
                params: [acctId, verificationCode]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    acctId,
                    'user',
                    'User resent a new verification code during sign-up process'
                ]
            }
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully created a new verification code for ${email}!`);
        
        // Set up email configuration for the user and send the new verification code to the user's email
        console.log(`Sending the new verification code to the user's email address: ${email}...`);
        emailInstance = new EmailConfiguration(
            email, 
            "Sign-up: New Verification Code", 
            "html",
            `Your new one time code is: <b>${verificationCode}</b><br />This code will expire in 10 minutes, so use it immediately to verify your email address.` 
        );

        transporter.sendMail(emailInstance.getMailOptions(), async (err, info) => {
            if (err) {
                error = new Error(`An error occured while sending the new verification code to ${email}`);
                error.status = 500;
                error.frontend_message = `A server error occured with the mailer while sending the new verification code to ${email}. Please try resending a new one again`;
                throw error;

            } else {
                // Log successful code sent action to the databsase
                insertQuery = "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);"
                resultQuery = await DatabaseScript.executeWriteQuery(insertQuery, [acctId, "system", "System successfully sent a new verification code to the user's email"]);

                console.log(`Successfully sent the new verification code to ${email}`);
                res.status(200).json({ 
                    message: `Successfully sent the verification code to ${email}. Check your email for the code (You might have to check in your spam folder if possible)`,
                    email: email
                });
                return;
            }
        });
        



    } catch (err: unknown) {
        next(err);
    }
}

// Delete all existing verification codes (Code expired based on UI timer)
export const removeAllVerificationCodes = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let acctId: number;
        let { email } = req.body as { email: string };
        let error: AppError;

        console.log("processing removeAllVerificationCodes...");

        console.log(`Checking if an email exist...`);
        if (!email) {
            error = new Error(`Unable to find email in the request body`);
            error.status = 404;
            error.frontend_message = 'An email must exist before resending a new verification code'
            throw error;
        }
        console.log(`${email} email is found!`);

        // Retrieve the user's id
        console.log(`Retrieving ${email}'s account ID from the database...`);
        selectQuery = "SELECT ACCT_ID FROM ACCOUNT WHERE ACCT_EMAIL = ?;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email]);

        if (resultQuery.length !== 1) {
            error = new Error(`Unable to find ${email} in the database`);
            error.status = 404;
            error.frontend_message = `${email} does not exist`
            throw error;
        }
        acctId = resultQuery[0].ACCT_ID;
        console.log(`${email} found! Their account ID is #${acctId}`);

        // Remove all existing verification codes for the user
        console.log(`Removing all verification codes for ${email}...`);
        transactionQuery = [
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [acctId]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    acctId,
                    'system',
                    'System removed all verification codes for the user as the most recent one expired'
                ]
            }
        ]
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully removed all verification codes for ${email}!`);

        res.status(200).json({
            message: `Verification code expired. Please resend a new one to your email (${email})`
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Verify the given verification code and sign-up the user
export const verifyVerificationCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let transactionQuery: ITransactionQuery[];
        let selectQuery: string;
        let resultQuery: any[];
        let error: AppError;
        let { email, verification_code } = req.body as { email: string, verification_code: string };
        let acctId: number;

        console.log("processing verifyVerificationCode...");

        console.log(`Checking if an email and verification code exist...`);
        if (!email || !verification_code) {
            error = new Error(`Unable to find email or verification code in the request body`);
            error.status = 404;
            error.frontend_message = 'Email and verification code must exist before verifying your code'
            throw error;
        }
        console.log(`email (${email}) and verification code (${verification_code}) are found!`);

        // Compare the user's verification code to the one in the database
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
            error = new Error(`${email}'s given verification code ${verification_code} does not match the one stored in the database`);
            error.status = 400;
            error.frontend_message = 'Invalid verification code'
            throw error;
        }
        acctId = resultQuery[0].ACCT_ID;
        console.log(`${email}'s provided verification code (${verification_code}) matches the valid one in the database!`);

        // Update the user's ACCT_VERIFIED and ACCT_ACTIVE to 'yes' to indicate that they've signed up successfully
        console.log(`Updating ${email}'s active and verified attributes...`);
        transactionQuery = [
            {
                query: "UPDATE ACCOUNT SET ACCT_VERIFIED = ?, ACCT_ACTIVE = ? WHERE ACCT_EMAIL = ?;",
                params: ['yes', 'yes', email]
            },
            {
                query: "DELETE FROM VERIFICATION_CODE WHERE ACCT_ID = ?;",
                params: [acctId]
            },
            {
                query: "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);",
                params: [
                    acctId,
                    'user',
                    'User successfully verified their email and successfully signed up'
                ]
            }
        ];
        resultQuery = await DatabaseScript.executeTransaction(transactionQuery);
        console.log(`Successfully updated ${email}'s active and verified attributes. User successfully signed up.`);

        res.status(200).json({ message: "Email verified and successfully signed up!" });
        return;

    } catch (err: unknown) {
        next(err);
    }
}