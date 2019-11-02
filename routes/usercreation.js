var express = require('express');
var router = express.Router();
var db = require('../app.js');
var nodemailer = require('nodemailer');
const shortid = require('shortid');

router.use(function(req,res,next){
  res.locals.authenticated = req.session.username;
  next();
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
        var userobj = {username,password,email,verified: false,posts: [],followers: [],following: []};
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
        req.app.locals.authenticated = true;
  
        req.session.username = username;
        req.flash('success_msg','You are logged in. ');
        res.status(200).send({"status": "OK"});
        return;
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

module.exports = router;