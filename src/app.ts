import path from "node:path";
import express from "express";
import session from "express-session";
import MySQLStore from "express-mysql-session";
import { router } from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { passport } from "./lib/passport.js";
import { prisma } from "./lib/prisma.js";

export const app = express();

const viewsPath = path.join(process.cwd(), "views");
const publicPath = path.join(process.cwd(), "public");

app.set("view engine", "ejs");
app.set("views", viewsPath);
app.use(express.static(publicPath));

//config req.body to parse json and urlencoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const SessionStore = MySQLStore(session);

const sessionStore = new SessionStore({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'laptop_shop',
  createDatabaseTable: true,
  clearExpired: true,
  checkExpirationInterval: 900_000,
  expiration: 86_400_000,
});

app.use(session({
  secret: process.env.SESSION_SECRET ?? 'dev-secret',
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: { httpOnly: true },
}));

app.use(passport.initialize());
app.use(passport.session());

app.use(async (_req, res, next) => {
  res.locals.user = _req.user;
  if (_req.user) {
    const cart = await prisma.cart.findUnique({ where: { userId: _req.user.id } });
    res.locals.cartCount = cart?.sum ?? 0;
  } else {
    res.locals.cartCount = 0;
  }
  next();
});

app.use(router);

app.use((_req, res) => {
  res.status(404).render('errors/404');
});

app.use(errorHandler);
