import path from 'node:path';
import express from 'express';
import { router } from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';

export const app = express();

const viewsPath = path.join(process.cwd(), 'views');
const publicPath = path.join(process.cwd(), 'public');

app.set('view engine', 'ejs');
app.set('views', viewsPath);
app.use(express.static(publicPath));
app.use(express.json());
app.use(router);
app.use(errorHandler);
