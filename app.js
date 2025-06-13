import createError from 'http-errors';
import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import logger from 'morgan';
import { fileURLToPath } from 'url';

let app = express();

import bodyParser from 'body-parser';
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

import cors from 'cors';
app.use(cors());

/* ------------------------------------------------------------ */
/* ----------------------  route setup  ------------------------ */

import homeRouter from './routes/homeRouter.js';
import groupRouter from './routes/groupRouter.js';
import ticketRouter from './routes/ticketRouter.js';

app.use('/', homeRouter);
app.use('/', groupRouter);
app.use('/', ticketRouter);

/* ------------------------------------------------------------ */
/* ------------------------------------------------------------ */

// view engine setup
const __dirname = path.dirname(fileURLToPath(import.meta.url));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// 에러 발생해도 서버가 꺼지지 않게 강제
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception 발생:", error);
});

export default app;
