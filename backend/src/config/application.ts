import dotenv from 'dotenv';
import { IAppConfig, IDatabasePool, ICorsOptions } from '../../types/types';
import path from 'path';
import fs from 'fs';
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
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization']
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

    // Used by Key and Cert
    static #sslAsUTF8(sslPath: string): string {
        const resolvePath = path.isAbsolute(sslPath) ? sslPath : path.resolve(process.cwd(), sslPath);
        let sslAsUTF8: string;

        sslAsUTF8 = fs.readFileSync(resolvePath, 'utf8');

        return sslAsUTF8;
    }
    public static readonly cert: string = ApplicationConfiguration.#sslAsUTF8(process.env.SSL_CERT_PATH ?? '');
    public static readonly key: string = ApplicationConfiguration.#sslAsUTF8(process.env.SSL_KEY_PATH ?? '');
}