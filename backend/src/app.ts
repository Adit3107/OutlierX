import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { config } from './config/index.js';
import apiRouter from './routes/api.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFoundHandler } from './middlewares/notfound.middleware.js';

const app: Express = express();

// Standard Security & Performance Enhancing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: config.server.frontendUrl,
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging Middleware
if (config.server.env !== 'test') {
  const logFormat = config.server.isProd ? 'combined' : 'dev';
  app.use(morgan(logFormat));
}

// Versioned routes mapping
app.use('/api/v1', apiRouter);

// Fallback 404 Route Interceptor
app.use(notFoundHandler);

// Centralized Unhandled Exception Controller
app.use(errorHandler);

export default app;
