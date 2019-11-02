var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const flash = require('connect-flash');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
var app = express();
app.use(flash());

var MongoClient = require('mongodb').MongoClient;
var url = "mongodb://130.245.171.203:27017/";

var client = new MongoClient(url,{useUnifiedTopology:true});

client.connect(function(err,db){
  //console.log("Database created!");
  var testdb = db.db("testdb");
  
  testdb.createCollection("users",function(err,res){
      if(err) throw err;
      //console.log("users collection created!");
      var user = testdb.collection("users");
      //var post = testdb.collection("posts");
      //console.log(user);
      exports.user = user;
      //exports.post = post;

  });

  testdb.createCollection("posts",function(err,res){
    if(err) throw err;
    var post = testdb.collection("posts");
    post.createIndex({content: 'text'});
    exports.post = post;
  });
});

/*
MongoClient.connect(url,{ useNewUrlParser: true, useUnifiedTopology: true },function(err,db){
    console.log("Database created!");
    var testdb = db.db("testdb");
    //console.log(MongoClient.showdbs());


    //console.log(MongoClient);
   
   
    testdb.createCollection("users",function(err,res){
        if(err) throw err;
        console.log("users collection created!");
        var user= testdb.collection("users");
        //console.log(user);
        exports.user = user;
       
        //testdb.close();
    });
});
*/


var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');
var usercreationRouter = require('./routes/usercreation');

var frontuserRouter = require('./routes/front_user');



app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    store: new MongoStore({client:client})
  })
);

//global variables

app.use(function(req, res, next) {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  //res.locals.error = req.flash('error');
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'twig');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/',usercreationRouter);
app.use('/user', userRouter);
app.use('/users',frontuserRouter);


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
