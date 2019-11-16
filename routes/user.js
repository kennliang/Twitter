var express = require('express');
var router = express.Router();
var db = require('../app.js');




/* GET users listing. */
router.get('/', function(req, res, next) {
 
  res.send('respond with a resource');
});

router.get('/:username',function(req,res,next){
  let username = req.params.username;
  console.log("223");
  db.user.findOne({username}).then(result => {
    if(result == null)
    {
      //req.flash('error_msg', 'Unable to find username:' + username + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find account with username " + username + " at /user/" + username });
      return;
    }
    console.log("Following " + result.following);
    console.log("Followers " + result.followers)
    let info = {"email": result.email,"followers": result.followers.length,"following":result.following.length};
    res.status(200).send({"status": "OK","user": info});
  });
});

router.get('/:username/posts',function(req,res,next){
  console.log("2231111");
  let username = req.params.username;
  const {limit} = req.query;
  console.log(limit);
  let limit_post = 50;
  if(limit != null && limit <= 200 && limit > 0)
    limit_post = limit;
  else if(limit > 200)
    limit_post = 200;
  db.user.findOne({username}).then(result => {
    if(result == null)
    {
      //req.flash('error_msg', 'Unable to find username:' + username + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find account with username " + username + " at /user/" + username });
      return;
    }
    /*
    let post_array = result.posts;
    let post_id_array = [];
    for(let i = 0 ; i < post_array.length && i < limit_post; i++)
    {
      let item = post_array[post_array.length -1 -i];
      post_id_array.push(item.id);
    }
    */
    res.status(200).send({"status": "OK","items": result.posts});
  });
   
});

router.get('/:username/followers',function(req,res,next){
  console.log("223666666666");
  let username = req.params.username;
  const {limit} = req.query;
  let limit_username = 50;
  if(limit != null && limit <= 200 && limit > 0)
    limit_username = limit;
  else if(limit > 200)
  limit_post = 200;
  db.user.findOne({username}).then(result => {
    if(result == null)
    {
      //req.flash('error_msg', 'Unable to find username:' + username + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find account with username " + username + " at /user/" + username });
      return;
    }
    let followers_array = result.followers;
    followers_array = followers_array.slice(0,limit_username);
    /*
    let post_id_array = [];
    for(let i = 0 ; i < post_array.length && i < limit_post; i++)
    {
      let item = post_array[post_array.length -1 -i];
      post_id_array.push(item.id);
    }
    */
    res.status(200).send({"status": "OK","users": followers_array});
   
  });
  
});
router.get('/:username/following',function(req,res,next){
  console.log("2434323");
  let username = req.params.username;
  const {limit} = req.query;
  let limit_username = 50;
  if(limit != null && limit <= 200 && limit > 0)
    limit_username = limit;
  else if(limit > 200)
  limit_post = 200;
  db.user.findOne({username}).then(result => {
    if(result == null)
    {
      //req.flash('error_msg', 'Unable to find username:' + username + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find account with username " + username + " at /user/" + username });
      return;
    }
    let following_array = result.following;
    following_array = following_array.slice(0,limit_username);
    res.status(200).send({"status": "OK","users": following_array});
  });
   
});

module.exports = router;
