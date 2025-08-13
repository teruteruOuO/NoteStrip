import { Request, Response, NextFunction } from 'express';
import { AppError, IDecodedTokenPayload, ITransactionQuery } from '../../types/types';
import { DatabaseScript } from '../models/database-script';
import { PersonalS3Bucket } from '../config/s3-bucket';