var createError = require('http-errors');


var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

var bodyParser = require('body-parser');

var mysql = require('mysql');

var express = require('express');
var app = express();
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);

var options = {
    host: 'localhost',
    port: 8889,
    user: 'root',
    password: 'root',
    database: 'whiteboard'
};


var sessionStore = new MySQLStore(options);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');


app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
}));

// to parse form submits
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));

app.use('/', indexRouter);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

/*
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
  //res.sendFile('error');
});
*/


module.exports = app;
