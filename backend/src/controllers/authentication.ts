import { Request, Response, NextFunction } from 'express';
import { AppError, IDecodedTokenPayload } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { LoginConfiguration } from '../config/login';
import { neutralizeString } from '../miscellaneous/neutralize-string';
import { EmailConfiguration } from '../config/email';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';

// Login user
export const loginUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let selectQuery: string;
        let insertQuery: string;
        let resultQuery: any[];
        let accountInstance: { id: number, password: string }
        let { email, password } = req.body as { email: string, password: string }
        let error: AppError;
        let isPasswordValid: boolean;
        let token: string;
        let loginInstance: LoginConfiguration;
        const isLoggedIn = req.cookies['token'] ? true : false;

        console.log(`Processing loginUser...`);

        console.log(`Checking if user is currently logged in...`);
        if (isLoggedIn) {
            error = new Error("User has a valid token and possibly logged in; therefore, they can't continue with the login process");
            error.status = 400;
            error.frontend_message = 'You must be logged out of your current account before you can login to another.'
            throw error;
        }
        console.log(`User is not logged in nor currently has a valid token. Success!`);

        console.log(`Checking if email and password exist...`);
        if (!email || !password) {
            error = new Error(`Unable to find email or password in the request body`);
            error.status = 404;
            error.frontend_message = 'Email and password must exist before loggin in'
            throw error;
        }
        console.log(`email (${email}) and password are found!`);

        // Find email in the database
        console.log(`Searching for user ${email} in the database...`);
        email = neutralizeString(email, true);
        selectQuery = "SELECT ACCT_ID, ACCT_PASSWORD FROM ACCOUNT WHERE LOWER(ACCT_EMAIL) = LOWER(?) AND ACCT_ACTIVE = ?;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery, [email, 'yes']);
        if (resultQuery.length !== 1) {
            error = new Error(`Unable to find user (${email}) in the database.`);
            error.status = 404;
            error.frontend_message = 'Incorrect Credentials!'
            throw error;
        }

        // Store retrieved information temporarily 
        accountInstance = {
            id: resultQuery[0].ACCT_ID,
            password: resultQuery[0].ACCT_PASSWORD
        }

        console.log(`Found user ${email} in the database!`);

        // Compare request password to the database password
        console.log(`Comparing ${email}'s given password to the one stored in the database`);
        isPasswordValid = await bcrypt.compare(password, accountInstance.password);
        console.log(`Password validation result for ${email}: ${isPasswordValid}`);

        accountInstance.password = "";
        if (!isPasswordValid) {
            error = new Error(`Given password does not match the database password. Cannot proceed with the login process.`);
            error.status = 400;
            error.frontend_message = "Incorrect Credentials!";
            throw error;
        }
        console.log(`Passwords match!`);

        // Configure token (includes email and user's ID)
        console.log(`Configuring login token for ${email}...`);
        token = jwt.sign(
            { 
                id: accountInstance.id, 
                email: email 
            }, 
            LoginConfiguration.jwtSecret, 
            { expiresIn: '8h' }
        );
        loginInstance = new LoginConfiguration();
        res.cookie('token', token, loginInstance.getLoginOptions());
        console.log(`Successfully configured ${email}'s login token...`);

        // Log the login action
        console.log(`Logging ${email}'s log in activity to the database...`);
        insertQuery = "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);";
        resultQuery = await DatabaseScript.executeWriteQuery(insertQuery, [accountInstance.id, "user", `User logged in`]);
        console.log(`Successfully recorded log in activity for ${email}`);

        console.log(`${email} successfully logged in to the system!`);
        res.status(200).json({
            message: `Successfully logged in!`,
            id: accountInstance.id
        });
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Logout user
export const logoutUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const token: string = req.cookies['token'];
        let insertQuery: string;
        let error: AppError;
        let decoded: any;
        let accountInstance: { id: number, email: string };
        let loginInstance = new LoginConfiguration();

        console.log(`logoutUser is running...`);

        console.log(`Checking if there's a valid token for the user logging out...`);
        if (!token) {
            error = new Error("A valid token must exist before logging out");
            error.status = 401;
            error.frontend_message = "No token provided.";
            throw error;
        }
        console.log(`The token is valid!`);

        // Check which user is logging out
        console.log(`Verifying the token's user...`);
        decoded = jwt.verify(token, LoginConfiguration.jwtSecret);
        accountInstance = { id: decoded.id, email: decoded.email }
        if (!accountInstance.id || !accountInstance.email) {
            error = new Error("Invalid ID or Email related to this specific login token. I don't know whose this is");
            error.status = 401;
            error.frontend_message = "Invalid token user";
            throw error;
        }
        console.log(`Token identified: The user is ${accountInstance.email} (user #${accountInstance.id}) is logging out!`);

        // Log the activity
        console.log(`Logging user log out activity in the database...`);
        insertQuery = "INSERT INTO ACTIVITY_LOG (ACCT_ID, LOG_TYPE, LOG_DESCRIPTION) VALUES (?, ?, ?);";
        await DatabaseScript.executeWriteQuery(insertQuery, [accountInstance.id, "user", 'User logged out']);
        console.log(`Log action success!`);

        console.log(`${accountInstance.email} has logged out.`);

        res.clearCookie('token', loginInstance.getLoginOptions());
        res.status(200).json({ message: 'Logout success' });
        
    } catch (err: unknown) {
        next(err);
    }
}

// Verify user's token for each route visit
export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let error: AppError;
        let { name, requires_authentication } = req.body as { name: string, requires_authentication: boolean };
        let userInformation: IDecodedTokenPayload;
        let newToken: string;
        let loginInstance: LoginConfiguration;
        const currentToken = req.cookies['token'] as string;

        console.log(`Processing verifyToken...`);

        console.log(`Checking if the route's name and its metadata is in the request body...`);
        if (!name || requires_authentication == null) {
            error = new Error("User accessing this route does not have the route's name or its metadata.");
            error.status = 404;
            error.frontend_message = `Route name and its metadata must be given first before you can continue`;
            throw error;
        }
        console.log(`Route name (${name}) and its metadata exist!`);

        // Verify user's token if the route's metadata requires authorization (need to be logged in)
        // then refresh the token's time limit
        if (requires_authentication) {
            // Check if user has a token
            console.log(`Checking if user has a token (logged in)...`);
            if (!currentToken) {
                error = new Error("User does not have a token");
                error.status = 404;
                error.frontend_message = `You do not have a token; therefore, you can't continue to the next page`
                throw error;
            }
            console.log(`User has a token!`);

            // Check if the token is actually valid
            console.log(`Checking if the user's token is valid...`);
            jwt.verify(currentToken, LoginConfiguration.jwtSecret, (err: any, decodedToken: any) => {
                if (err) {
                    error = new Error(`User's token is not valid`);
                    error.status = 401;
                    error.frontend_message = `You do not have a token; therefore, you can't continue to the next page`
                    throw error;
                }

                userInformation = decodedToken as IDecodedTokenPayload;
                console.log(`The user's token is valid! The user is ${userInformation.email} (ID: ${userInformation.id})`);

                // Refresh the user's token 
                console.log(`Refreshing the token for ${userInformation.email}...`);
                newToken = jwt.sign(
                    { 
                        id: userInformation.id, 
                        email: userInformation.email 
                    }, 
                    LoginConfiguration.jwtSecret, 
                    { expiresIn: '8h' }
                );
                loginInstance = new LoginConfiguration();
                res.cookie('token', newToken, loginInstance.getLoginOptions());
                console.log(`Successfully refreshed ${userInformation.email}'s login token...`);
            });
        }

        console.log(`Route to ${name} page by a user success! requiresAuth: ${requires_authentication}`);
        res.status(200).json({ message: `Route to ${name} page success! requiresAuth: ${requires_authentication}`});
        return;

    } catch (err: unknown) {
        next(err);
    }
}

// Unrelated: Sent user feedback to the DEV's email
export const submitFeedback = async (req: Request, res: Response, next: NextFunction) => {
    try {
        type Feedback = { email: string | 'anonymous', title: string, content: string };
        let { email, title, content } = req.body as Feedback;
        let error: AppError;
        let emailInstance: EmailConfiguration;
        let transporter = nodemailer.createTransport(EmailConfiguration.systemEmail);

        console.log('Processing submitFeedback...');

        console.log(`Checking if submitter has email, title, or content`);
        if (!email || !title || !content) {
            error = new Error("Submitter does not have email, title, or content in the request body");
            error.status = 404;
            error.frontend_message = `You must provide your email (optional) and the content's title and body`
            throw error;
        }
        console.log(`Found the email, title, and content in the submitter's form!`);

        email = neutralizeString(email, true);

        // Send the email content to the DEV's email
        console.log(`Sending the submitter's (${email}) feedback to the DEV`);
        emailInstance = new EmailConfiguration(
            EmailConfiguration.devEmail, 
            `User Feedback: ${title} by ${email}`, 
            "text",
            content 
        );
        transporter.sendMail(emailInstance.getMailOptions(), async (err, info) => {
            if (err) {
                error = new Error(`An error occured while sending the submitter's feedback to the dev's email`);
                error.status = 500;
                error.frontend_message = "A server error occured while submitting your feedback to the developer. Please Try Again";
                throw error;

            } else {
                console.log(`Successfully sent the submitter's feedback to the developer!`);
                res.status(200).json({ message: `Thank you for your feedback` });
                return;
            }
        });

    } catch (err: unknown) {
        next(err);
    }

}
