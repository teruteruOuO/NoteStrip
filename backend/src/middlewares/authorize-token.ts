import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AppError, IDecodedTokenPayload } from '../../types/types';
import { LoginConfiguration } from '../config/login';

export const authorizeToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.token;
    let error: AppError;
    console.log(`Processing authorizeToken...`);

    console.log(`Checking if user has a token...`)
    if (!token) {
        error = new Error("User with a missing token is attempting to retrieve a sensitive information");
        error.status = 404;
        error.frontend_message = "You must be logged in to access this resource.";
        return next(error);
    }
    console.log(`A token is found!`);

    console.log(`Checking if the user's token is valid...`);
    jwt.verify(token, LoginConfiguration.jwtSecret, (err: any, decodedToken: any) => {
        if (err) {
            error = new Error("Invalid token provided by the user.");
            error.status = 401;
            error.frontend_message = "Your session is invalid or expired. Please log in again.";
            return next(error);
        }
        console.log(`A valid token is found!`);

        req.user = decodedToken as IDecodedTokenPayload;
        next();
    });
};
