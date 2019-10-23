var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
const shortid = require('shortid');


//var db = require("../database/test.js");
var db = require('../app.js');

/* GET home page. */
router.get('/', function(req, res, next) {
  //console.log(dbes);
  //console.log(dbes.consum);
  /*
  var myobj = { name: "test", address: "fish" };
  db.consum.insertOne(myobj,function(err,res){
    if(err) throw err;
    console.log("inserted document");
    //console.log("list of collections " + testdb.listCollections());
});*/
  res.render('index',{ok:'test'});
});

router.get('/adduser', function(req, res, next) {
  res.render('register');
 
});
router.post('/adduser', function(req, res, next) {

  console.log("Add user " + req.body);
  const { username, email, password } = req.body;
  //check missing parms
  if(username == null || email == null || password == null)
  {
    //console.log("missing parameters");
    req.flash('error_msg','Missing input. Please fill in all fields.');
    res.status(400).send( {"status": "error", "error": "missing adduser request parms at /adduser"});
    return;
  }
  //check if existing username
  db.user.findOne({username}).then(result =>{
    console.log(result);
    if(result != null)
    {
      req.flash('error_msg', 'Username already exists.');
      res.status(400).send({ "status": "error", "error": "Username already exists at /adduser" });
      return;
    }
    //check if existing email
    db.user.findOne({email}).then(result =>{
      if(result != null)
      {
        req.flash('error_msg', 'Email already exists.');
        res.status(400).send({ "status": "error", "error": "Email already exists at /adduser" });
        return;
      }
      // add into db
      var userobj = {username,password,email,verified: false,posts: []};
      db.user.insertOne(userobj);

      //send verification 
      var transporter = nodemailer.createTransport({
        host: 'localhost',
        port: 25,
        tls: {rejectUnauthorized: false}
      });
      
      var mailOptions = {
        from: 'kennliang@cs.stonybrook.edu',
        to: email,
        subject: 'Sending Verification Key',
        text: 'validation key: <abracadabra>'
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
          req.flash('error_msg','Error with sending email.');
          res.status(400).send( {"status": "error", "error": "Error with sending email at /adduser"});
          return;
        } else {
          console.log('Email sent: ' + info.response);
          req.flash('success_msg','You are now registered. Please verify with the key send to your email.');
          res.status(200).send({"status": "OK"});
        }
      });
      //console.log("success");

    
    },err =>{
      console.log("error in findOne email" + err);
      req.flash('error_msg','error in findOne email');
      res.status(400).send( {"status": "error", "error": "error in findOne emai at /adduserl"});
      return;
    });
  },err =>{
    console.log("error in findOne username" + err);
    req.flash('error_msg','error in findOne username.');
    res.status(400).send( {"status": "error", "error": "error in findOne usernameat /adduser"});
    return;
  });

});

router.get('/verify', function(req, res, next) {
  res.render('verify');
});
router.post('/verify', function(req, res, next) {
  console.log("Verify " + req.body);
  const {email,key} = req.body;
  if(email == null || key == null)
  {
    req.flash('error_msg', 'Missing email or key paramters.');
    res.status(400).send({ "status": "error", "error": "Missing email or key parameters at /verify" });
    return;
  }
  if(key != "abracadabra"){
    req.flash('error_msg', 'Verification key does not match.');
    res.status(400).send({ "status": "error", "error": "Verification key does not match at /verify." });
    return;
  }
  const query = { email:email, verified:false};
  const update_verified = { $set: {verified:true}};
  const options = {upsert:false};

  db.user.updateOne(query,update_verified,options).then(result =>{
    /*
    console.log("match count");
    console.log(result.matchedCount);
    console.log("modified count");
    console.log(result.modifiedCount);*/

    if(result.matchedCount == 0)
    {
      req.flash('error_msg', 'Unable to find ' + email + ' .');
      res.status(400).send({ "status": "error", "error": 'unable to find '+ email + ' at /verify.' });
      return;
    }
    if(result.modifiedCount == 0)
    {
      req.flash('error_msg', 'Unable to verify ' + email + ' .');
      res.status(400).send({ "status": "error", "error": 'unable to verify '+ email + ' at /verify.' });
      return;
    }
    
    req.flash('success_msg','You are now verified. Please sign in.');
    res.status(200).send({"status": "OK"});

  },err =>{
    
    req.flash('error_msg', 'updateOne failed.');
    res.status(400).send({ "status": "error", "error": "updateOne failed at /verify." });
    return;
  });
});

router.get('/login', function(req, res, next) {
  res.render('login');
 });
 router.post('/login', function(req, res, next) {
   console.log("login in " + req.body);
   const {username,password} = req.body;
   if(username == null || password == null)
   {
    req.flash('error_msg', 'Missing username or password input.');
    res.status(400).send({ "status": "error", "error": "Missing username or password parameters at /login" });
    return;
   }
   db.user.findOne({username}).then(result => {
    if(result == null)
    {
      req.flash('error_msg', 'Unable to find username:' + username + '.');
      res.status(400).send({ "status": "error", "error": "Missing account username " + username + " at /login" });
      return;
    }
    console.log(result);
    if(result.verified == false)
    {
      req.flash('error_msg', 'You are not verified. Please check your email for the verification key.');
      res.status(400).send({ "status": "error", "error": "Unverified account " + username + " at /login" });
      return;
    }
    if(result.password == password)
    {
      console.log("success login credentials");

      req.session.username = username;
      req.flash('success_msg','You are logged in. ');
      res.status(200).send({"status": "OK"});
    }
    req.flash('error_msg', 'Invalid password.Please try again.');
    res.status(400).send({ "status": "error", "error": "Invalid password for  " + username + " at /login" });
    return;
    
   });
 
 });

 router.get('/logout',function(req,res,next){
   if(req.session.username != null)
   {
    res.render('logout');
    return;
   }
   req.flash('error_msg','You are not logged in to log out');
   res.redirect('login');
   return;
 });

 router.post('/logout', function(req, res, next) {
  console.log(req.session.username);
  if(req.session.username == null)
  {
    req.flash('error_msg', 'No user to log out.');
    res.status(400).send({ "status": "error", "error": "No username to logout at /logout" });
    return;
  }
  req.session.destroy((err) =>{
    if(err){
      //req.flash('error_msg', 'Error in destroying session.');
      res.status(400).send({ "status": "error", "error": "Error in destroying session /logout" });
      return;
    }
    //req.flash('success_msg','You are logged out. ');
    res.status(200).send({"status": "OK"});
    return;
  });

 });

router.get('/additem',function(req,res,next){
  if(req.session.username != null)
  {
    res.render('additem');
    return;
  }
  req.flash('error_msg','Please log in to make a post');
  res.redirect('login');
  
});
router.post('/additem',function(req,res,next){
  console.log("Adding an item " + req.session.username);
  const {content, childType} = req.body;
  if(req.session.username == null)
  {
     req.flash('error_msg', 'Please log in to add an item.');
     res.status(400).send({ "status": "error", "error": "User is not logged in to add item at /additem" });
     return;
  }
  if(content == null)
  {
    req.flash('error_msg', 'Missing content information.');
    res.status(400).send({ "status": "error", "error": "Missing content parameters at /additem" });
    return;
  }

  //create item
  var postobj = { id: shortid.generate(),username: req.session.username,property : {likes : 0},retweeted: 0,content,timestamp : Date.now()/1000};
  db.post.insertOne(postobj);

  //update user
  const query = { username:req.session.username};
  const update_verified = { $push: {posts: postobj}};
  const options = {upsert:false};
  db.user.updateOne(query,update_verified,options).then(result =>{

    if(result.matchedCount == 0 || result.modifiedCount == 0)
      console.log("updateOne unable to match query or modify the document at /additem");

    req.flash('success_msg','You successfully made a post. ');
    res.status(200).send({"status": "OK","id":postobj.id});
    return;
  },err => {
    console.log("updateOne failed " + err);
  });

});

router.get('/post/:id',function(req,res,next){
  let item_id = req.params.id;
  console.log(item_id);
  db.post.findOne({id : item_id}).then(result =>{
    if(result == null)
    {
      req.flash('error_msg', 'Unable to find post with id: ' + item_id + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find post with id: " + item_id + "at /item/" + item_id });
      return;
    }
    //req.flash('success_msg','S. ');
    res.render('post',{post : result});
    return;
  });
});

router.get('/item/:id',function(req,res,next){
  let item_id = req.params.id;
  console.log(item_id);
  db.post.findOne({id : item_id}).then(result =>{
    if(result == null)
    {
      req.flash('error_msg', 'Unable to find post with id: ' + item_id + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find post with id: " + item_id + "at /item/" + item_id });
      return;
    }
    //req.flash('success_msg','S. ');
    res.status(200).send({"status": "OK","item":result});
    return;
  });
});

router.get('/search',function(req,res,next){
  res.render('search');
});

router.post('/search',function(req,res,next){
  const {timestamp,limit} = req.body;
  let search_limit = 25;
  let search_time = Date.now()/1000;
  //console.log("inside the search post");
  if(timestamp != null)
    search_time = timestamp;
  if(limit != null && limit > 0 && limit <= 100)
    search_limit = limit;
/*
  if(typeof(search_limit) == 'string')
    search_limit = Number(search_limit);
  if(typeof(search_time) == 'string')
    search_time = Number(search_time)

  console.log(typeof(search_limit));
  console.log(typeof(search_time));*/
  

  let sorter = {timestamp: -1};
  let query = {timestamp: {$lte: search_time}};
  db.post.find(query).sort(sorter).limit(search_limit).toArray(function(err,result){
    if(err)
      console.log("error in find /search " + err);
    //console.log(result);
    res.status(200).send({"status": "OK","items":result});
  });
  
    
});

module.exports = router;
