import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes/';
import path from 'path';
import { unhandledError } from './middlewares/unhandledError';
import swaggerUI from 'swagger-ui-express';
import swaggerDocument from './openApi';
import { decodeIds, encodeIds } from './middlewares/hashedIds';

// create and setup express app
const app = express();

// Basic middlewares
app.use(cors({ origin: true, credentials: true }));
app.use(helmet());
app.use(cookieParser());
app.use(express.json());

// Integrate Swagger
app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// API routes (using path.posix to prevent backslashes in URLs when running on Windows)
const useRoutes = path.posix.join('/', process.env.API_ROUTE ?? '');
app.use(useRoutes, routes);

// Obfuscate ids on response json
app.use(encodeIds);

// Add error handling middleware
app.use(unhandledError);

export default app;
