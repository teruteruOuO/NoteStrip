import dotenv from 'dotenv';
import { IAppConfig, IDatabasePool, ICorsOptions } from '../../types/types';
dotenv.config();

export class ApplicationConfiguration {

    // Private constructor prevents creating instances
    private constructor() {}

    // Application configuration for starting up the web server
    public static readonly application: IAppConfig = {
        port: Number(process.env.APP_PORT) || 3000,
        server_url: process.env.SERVER_URL || 'http://localhost',
        node_environment: (process.env.NODE_ENVIRONMENT as "development" | "production") || 'development'
    }

    // Cors settings and allow credentials to set only to the specified frontend url
    public static readonly corsOptions: ICorsOptions = {
        origin: process.env.FRONTEND_URL || 'localhost:3002',
        credentials: true
    }

    // Database configuration settings
    public static readonly database: IDatabasePool = {
        host: process.env.DB_HOST || 'application',
        user: process.env.DB_USER || 'admin',
        password: process.env.DB_PASSWORD || 'password',
        database: process.env.DB_NAME || 'database',
        port: Number(process.env.DB_PORT) || 3306,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 15 * 1000
    }
}