import express from 'express';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

app.use(express.json());
app.use(router);
app.use(errorHandler);
