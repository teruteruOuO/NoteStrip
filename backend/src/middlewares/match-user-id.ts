import { Request, Response, NextFunction } from 'express';
import { AppError, IDecodedTokenPayload } from '../../types/types';

export const matchUserId = (req: Request, res: Response, next: NextFunction) => {
    const userTokenInformation = req.user as IDecodedTokenPayload;
    const tokenUserId: number = userTokenInformation.id;
    const paramUserId: number = Number(req.params.acct_id);
    let error: AppError;

    console.log(`Processing matchUserId...`);

    console.log(`Checking if user's ID exist from the token as well as the parameter user ID given from the frontend...`)
    if (!tokenUserId || !paramUserId) {
        error = new Error("Token ID or Parameter ID is missing");
        error.status = 404;
        error.frontend_message = "Invalid request";
        return next(error);
    }
    console.log(`Token and Parameter IDs found!`);

    console.log(`Checking if both IDs match (${tokenUserId} == ${paramUserId}?)`);
    if (tokenUserId !== paramUserId) {
        error = new Error(`Token ID #${tokenUserId} does not match the Parameter ID #${paramUserId}. Unable to continue the process.`);
        error.status = 401;
        error.frontend_message = "Invalid request";
        return next(error);
    }
    console.log(`Both IDs match! (${tokenUserId} == ${paramUserId})`);

    next();
};
