import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../types/types';
import { DatabaseScript } from '../models/database-script';

export const getTestTable = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let selectQuery: string;
        let resultQuery: any[];
        let testEntities: { id: number, name: string }[]
        let error: AppError;

        selectQuery = "SELECT * FROM TEST;";
        resultQuery = await DatabaseScript.executeReadQuery(selectQuery);

        // Throw an error if nothing exist in the table
        if (resultQuery.length <= 0) {
            error = new Error("No rows found in the TEST table");
            error.status = 404;
            error.frontend_message = "No test rows found";
            throw error;
        }
    
        console.log("Found at least one entry in the test table");
        testEntities = resultQuery.map(result => {
            return {
                id: result.TEST_ID,
                name: result.TEST_NAME
            }
        });

        res.status(200).json({
            message: 'Test rows found',
            test: testEntities
        });

    } catch (err: unknown) {
        next(err);
    }
}