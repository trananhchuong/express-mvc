import path from "node:path";
import express from "express";
import session from "express-session";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";

export const app = express();

const viewsPath = path.join(process.cwd(), "views");
const publicPath = path.join(process.cwd(), "public");

app.set("view engine", "ejs");
app.set("views", viewsPath);
app.use(express.static(publicPath));

//config req.body to parse json and urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
  secret: process.env.SESSION_SECRET ?? 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true },
}));

app.use(router);

app.use((_req, res) => {
  res.status(404).render('errors/404');
});

app.use(errorHandler);
