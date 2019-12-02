var express = require('express');
var router = express.Router();
var db = require('../app.js');
var nodemailer = require('nodemailer');
const shortid = require('shortid');
/*
router.use(function(req,res,next){
  res.locals.authenticated = req.session.username;
  next();
});
*/

router.get('/adduser', function(req, res, next) {
    res.render('register');
   
});
router.post('/adduser', function(req, res, next) {
  const adduser = async function(req,res){
    try{
      const { username, email, password } = req.body;
     
      if(username == null || email == null || password == null)
        throw new Error("Missing required parameters at /adduser");
  
      //check if existing username
      let result = await db.user.findOne({username});
      if(result != null)
        throw new Error("Username already exists at /adduser");
      
        //check if existing email
      let result2 = await  db.user.findOne({email});
      if(result2 != null)
        throw new Error("Email already exists at /adduser");
      
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
            if(error)
              throw new Error(error);
            res.status(200).send({"status": "OK"});
          });
    }
    catch(e){
      console.log("Try catch error at adduser "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at adduser"+e});
    }
  }  
  adduser(req,res);
});
  
router.get('/verify', function(req, res, next) {
  res.render('verify');
});
router.post('/verify', function(req, res, next) {
  const verify = async function(req,res){
    try{
      //console.log("Verify " + req.body);
      const {email,key} = req.body;
      if(email == null || key == null)
        throw new Error("Missing parameters at /verify")
      if(key != "abracadabra")
        throw new Error("Invalid verification key at /verify");
      //const query = { email:email, verified:false};
      const update_verified = { $set: {verified:true}};
      const options = {upsert:false};

      let find_user = await db.user.findOne({email:email});
      //console.log(find_user);
      if(find_user == null || find_user.verified == true)
        throw new Error("unable to find the user with email to verify or user is already verified");
      
      const query = { username: find_user.username};
      let result = await db.user.updateOne(query,update_verified,options);
      if(result == null || result.matchedCount == 0 || result.modifiedCount == 0)
        throw new Error("Unable to find or update the user to verify");
      
      res.status(200).send({"status": "OK"});

    }
    catch(e){
      console.log("Try catch error at verify "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at verify"+e});
    }
  }
  verify(req,res);
});
  
router.get('/login', function(req, res, next) {
  res.render('login');
});

router.post('/login', function(req, res, next) {
  const login = async function(req,res){
    try
    {
      const {username,password} = req.body;
      if(username == null || password == null)
        throw new Error("Missing parameters at /login");
      let result = await db.user.findOne({username});
      if(result == null)
        throw new Error("Unable to find user to log in");
      
      if(result.verified == false)
        throw new Error("User is not verified therefore cannot log in");
       //req.app.locals.authenticated = true;
      if(result.password == password)
      {
        req.session.username = username;
        //req.flash('success_msg','You are logged in. ');
        res.status(200).send({"status": "OK"});
      }
      else
        throw new Error("Invalid password at /login");
    }
    catch(e){
      console.log("Try catch error at login "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at login"+e});
    }
  }
  login(req,res);
});
  
router.get('/logout',function(req,res,next){
  if(req.session.username != null)
    res.render('logout');
  else
    res.redirect('login');
});
  
router.post('/logout', function(req, res, next) {
  console.log(req.session.username);
  if(req.session.username == null)
    res.status(400).send({ "status": "error", "error": "No username to logout at /logout" });
  else
  {
    req.session.destroy((err) =>{
      if(err) 
        res.status(400).send({ "status": "error", "error": "Error in destroying session /logout" });
      else
        res.status(200).send({"status": "OK"});
    });
  }
});

module.exports = router;