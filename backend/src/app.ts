import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { ApplicationConfiguration } from './config/application';
import { errorHandler } from './middlewares/error-handler';
import morgan from 'morgan';

// import routes
import test from './routes/test';

const app = express();

/* Setup middleware */
app.use(morgan('dev')); // 'dev' is a predefined format for concise colored output
app.use(cors(ApplicationConfiguration.corsOptions));
app.use(cookieParser()); // Parse cookies from requests
app.use(express.json());

// Routes
app.use('/api/test', test);
app.use(errorHandler); // Global error handler (should be after routes)

export default app;
