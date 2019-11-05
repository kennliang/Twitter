var express = require('express');
var router = express.Router();
var db = require('../app.js');


router.use(function(req,res,next){
  
    res.locals.authenticated = req.session.username;
  
  next();
});



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
/*
router.get('/:username/posts',function(req,res,next){
  console.log("2231111");
  let username = req.params.username;
  const {limit} = req.body;
  let limit_post = 50;
  if(limit != null && limit <= 200 && limit > 0)
    limit_post = limit;
  db.user.findOne({username}).then(result => {
    if(result == null)
    {
      req.flash('error_msg', 'Unable to find username:' + username + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find account with username " + username + " at /user/" + username });
      return;
    }
    let post_array = result.posts;
    let post_id_array = [];
    for(let i = 0 ; i < post_array.length && i < limit_post; i++)
    {
      let item = post_array[post_array.length -1 -i];
      post_id_array.push(item.id);
    }
    res.status(200).send({"status": "OK","items": post_id_array});
  });
   
});
*/

module.exports = router;
