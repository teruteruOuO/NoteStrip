import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApplicationConfiguration } from './config/application';
import { errorHandler } from './middlewares/error-handler';
import morgan from 'morgan';

// import routes
import signup from './routes/sign-up';
import authentication from './routes/authentication';
import passwordRecovery from './routes/password-recovery';
import account from './routes/account';
import book from './routes/book';

const app = express();

/* Setup middleware */
app.use(morgan('dev')); // 'dev' is a predefined format for concise colored output
app.use(cors(ApplicationConfiguration.corsOptions));
app.use(cookieParser()); // Parse cookies from requests
app.use(express.json());

// Routes
app.use('/api/sign-up', signup);
app.use('/api/authentication', authentication);
app.use('/api/password-recovery', passwordRecovery);
app.use('/api/account', account);
app.use('/api/book', book);
app.use(errorHandler); // Global error handler (should be after routes)

export default app;
