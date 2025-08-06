import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { LoginConfiguration } from '../config/login';
import { neutralizeString } from '../miscellaneous/neutralize-string';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

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
