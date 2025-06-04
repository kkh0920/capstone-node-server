let createError = require('http-errors');
let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
let logger = require('morgan');

let app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const cors = require('cors');
app.use(cors());

/* ------------------------------------------------------------ */
/* ----------------------  route setup  ------------------------ */

let indexRouter = require('./routes/index');
let groupRouter = require('./routes/groupRouter');
let ticketRouter = require('./routes/ticketRouter');

app.use('/', indexRouter);
app.use('/', groupRouter);
app.use('/', ticketRouter);
// app.use('/api/group', groupRouter);
// app.use('/api/ticket', ticketRouter);

/* ------------------------------------------------------------ */
/* ------------------------------------------------------------ */

// view engine setup
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

module.exports = app;

// 에러 발생해도 서버가 꺼지지 않게 강제
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception 발생:", error);
});

