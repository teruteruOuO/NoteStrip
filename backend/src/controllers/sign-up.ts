import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { generateCode } from '../miscellaneous/generate-code';
import { neutralizeString } from '../miscellaneous/neutralize-string';
import { ITransactionQuery } from '../../types/types';
import { EmailConfiguration } from '../config/email';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';

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
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
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

        // Neutralize email
        console.log(`Neutralizing email and setting up user nickname...`);
        email = neutralizeString(email, true);
        nickname = email.split("@")[0] // takes the string before the @ from the email
        console.log(`Successfully neutralized user's email and set up their nickname!`);
        console.log(`Email: ${email}; Nickname: ${nickname}`);

        // Ensure password rule is still followed and not bypassed in the frontend
        console.log(`Checking if user password is still valid...`);
        if (!passwordRegex.test(password)) {
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