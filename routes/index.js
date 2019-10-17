var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');


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
  res.render('index');
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
      var userobj = {username,password,email,verified: false};
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
        }
      });
      //console.log("success");
      req.flash('success_msg','You are now registered. Please verify with the key send to your email.');
      res.status(200).send({"status": "OK"});
    
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
      req.flash('error_msg', 'Unable to find ' + username + '.');
      res.status(400).send({ "status": "error", "error": "Missing account username " + username + " at /login" });
      return;
    }
    console.log(result);
    if(result.password == password)
    {
      console.log("success login credentials");

      req.session.username = username;
      req.flash('success_msg','You are logged in. ');
      res.status(200).send({"status": "OK"});
    }
   });
 
 });
 router.post('/logout', function(req, res, next) {
  console.log(req.session.username);
  req.session.destroy((err) =>{
    if(err){
      req.flash('error_msg', 'Error in destroying session.');
      res.status(400).send({ "status": "error", "error": "Error in destroying session /logout" });
      return;
    }
  })
 });

router.get('/dashboard',function(req,res,next){
  res.render('dashboard');
});
router.get('/dashboard',function(req,res,next){
  //res.render('dashboard');
  console.log(req.session.username)
});











module.exports = router;
