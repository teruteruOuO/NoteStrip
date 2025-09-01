import { JwtPayload } from 'jsonwebtoken';

declare global {
  namespace Express {
    interface Request {
      user?: string | JwtPayload;
      cookies?: { [key: string]: string };
    }
  }
}

// Database Attribute Types
export type YesOrNo = "yes" | "no";

// Web Server Types
export interface ITransactionQuery {
    query: string;
    params?: any[]
}

export interface IDecodedTokenPayload {
    id: number;
    email: string; 
    iat: number;
    exp: number;
}

// Extensions on existing Types
export interface AppError extends Error {
    status?: number;
    frontend_message?: string; // messages that will be outputted in JSON
    // SQL related errors
    status?: number;
    code?: string;
    errno?: number;
    sqlMessage?: string;
    sqlState?: string;
    index?: number;
    sql?: string;
}

/* Configuration Types */
export interface IAppConfig {
    port: number,
    server_url: string,
    node_environment: "development" | "production"
}

export interface IDatabasePool {
    host: string,
    user: string,
    password: string,
    database: string,
    port: number,
    waitForConnections: boolean,
    connectionLimit: number,
    queueLimit: number,
    connectTimeout: number
}

export interface ICorsOptions {
    origin: string,
    credentials: boolean,
    methods?: string[],          // optional list of allowed HTTP methods
    allowedHeaders?: string[]    // optional list of allowed request headers
}

export interface ICookieToken {
    httpOnly: boolean;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none' | false;
    maxAge?: number;
}

export interface IEmail {
    service: string;
    auth: {
        user: string;
        pass: string;
    },
    pool: boolean;
    maxConnections: number;
    maxMessages: number;
    rateLimit: number;
    tls: { rejectUnauthorized: boolean } 
}

export interface IMailOptions {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

export interface IBucket {
    access_key: string,
    secret_access_key: string,
    aws_region: string,
    s3_bucket: string
}
