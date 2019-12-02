var express = require('express');
var router = express.Router();
var db = require('../app.js');


/* GET users listing. */
router.get('/', function(req, res, next) {
 
  res.send('respond with a resource');
});

router.get('/:username',function(req,res,next){
  const userprofile = async function(req,res){
  try{
      let username = req.params.username;
      let result = await db.user.findOne({username});
      if(result == null)
        throw new Error("Unable to find username: " + username);
      
      let info = {"email": result.email,"followers": result.followers.length,"following":result.following.length};
      res.status(200).send({"status": "OK","user": info});
    }
    catch(e){
      console.log("Try catch error at get request /username "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at get request /username"+e});
    }
  }
  userprofile(req,res);
});

router.get('/:username/posts',function(req,res,next){
  const posts = async function(req,res){
  try{
      let username = req.params.username;
      const {limit} = req.query;
      let limit_post = 50;
      if(limit != null && limit <= 200 && limit > 0)
        limit_post = limit;
      else if(limit > 200)
        limit_post = 200;
      let result = await db.user.findOne({username});
      if(result == null)
        throw new Error("Unable to find username : "+ username);
      
      let following_array = result.posts;
      following_array = following_array.slice(0,limit_post);
      res.status(200).send({"status": "OK","items": result.posts});
    }
    catch(e){
      console.log("Try catch error at user's post "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at user's post"+e});
    }
  } 
  posts(req,res);  
});

router.get('/:username/followers',function(req,res,next){
  const followers = async function(req,res){
    try{
      let username = req.params.username;
      const {limit} = req.query;
      let limit_username = 50;
      if(limit != null && limit <= 200 && limit > 0)
        limit_username = limit;
      else if(limit > 200)
      limit_post = 200;
      let result = await db.user.findOne({username});
      if(result == null)
        throw new Error("Unable to find username: " + username);
      
      let followers_array = result.followers;
      followers_array = followers_array.slice(0,limit_username);
      res.status(200).send({"status": "OK","users": followers_array});
    }
    catch(e){
      console.log("Try catch error at user's followers "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at user's followers"+e});
    }
  }
  followers(req,res);
  
});
router.get('/:username/following',function(req,res,next){
  const following = async function(req,res){
    try{
      let username = req.params.username;
      const {limit} = req.query;
      let limit_username = 50;
      if(limit != null && limit <= 200 && limit > 0)
        limit_username = limit;
      else if(limit > 200)
      limit_post = 200;
      let result = await db.user.findOne({username});
      if(result == null)
        throw new Error("Unable to find username: " + username);
  
      let following_array = result.following;
      following_array = following_array.slice(0,limit_username);
      res.status(200).send({"status": "OK","users": following_array});
    }
    catch(e){
      console.log("Try catch error at user's following "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at user's following"+e});
    }
  }

  following(req,res);
   
});

/**
 * FRONT END END POINT
 */
router.get('/:username',function(req,res,next){
  let username = req.params.username;
  console.log("223");
  db.user.findOne({username}).then(result => {
    if(result == null)
    {
      req.flash('error_msg', 'Unable to find username:' + username + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find account with username " + username + " at /user/" + username });
      return;
    }
    console.log(result);
    
    // put this shit back in users

    let info = {
        "email": result.email,
        "followers_count": result.followers.length,
        "following_count":result.following.length,
        "followers":result.followers,
        "following":result.following,
        "posts":result.posts,
    };
    res.render('profile',{userinfo:info,username:username});
    //res.status(200).send({"status": "OK","user": info});
  });
});

module.exports = router;
