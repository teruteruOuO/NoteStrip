import dotenv from 'dotenv';
import { ICookieToken } from '../../types/types';
dotenv.config();

export class LoginConfiguration {
    public static readonly jwtSecret: string = process.env.JWT_SECRET || 'none';

    // Instance-specific properties
    private maxAge: number;

    constructor(maxAge: number) {
        this.maxAge = maxAge
    }

    // Returns this instance's mail options
    public getLoginOptions(): ICookieToken {
        let option: ICookieToken = process.env.NODE_ENVIRONMENT === "production"
        ? { httpOnly: true, secure: true, sameSite: 'none', maxAge: this.maxAge }
        : { httpOnly: true, secure: false, sameSite: 'lax', maxAge: this.maxAge }

        return option;
    }
}