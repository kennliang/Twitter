var express = require('express');
var router = express.Router();
const shortid = require('shortid');

router.use(function(req,res,next){
  res.locals.authenticated = req.session.username;
  next();
});


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

router.get('/item/:id',function(req,res,next){

  let item_id = req.params.id;
  console.log("Get item with id " + item_id);
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

router.delete('/item/:id',function(req,res,next){
  let item_id = req.params.id;
  if(req.session.username == null)
  {
    req.flash('error_msg', 'Please log in to delete the post.');
    res.status(400).send({ "status": "error", "error": "User is not logged in to delete item" });
    return;
  }
  console.log("Deleting item with id " + item_id);
  db.post.findOneAndDelete({username: req.session.username,id:item_id}).then(result =>{
  console.log(result);
  if(result.value == null)
  {
    req.flash('error_msg', 'Unable to find post to delete with id: ' + item_id + '.');
    res.status(400).send({ "status": "error", "error": "Unable to find post to delete with id: " + item_id + "at /item/" + item_id });
    return;
  }
  const query = { username: result.value.username};
  const update = { $pull: {posts: result.value}};
  const options = {upsert:false};
  db.user.updateOne(query,update,options).then(result =>{
    if(result == null)
    {
      req.flash('error_msg', 'Unable to find post to delete with id: ' + item_id + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find post to delete with id: " + item_id + "at /item/" + item_id });
      return;
    }
    if(result.matchedCount == 0 || result.modifiedCount == 0)
    {
      console.log("updateOne unable to match query or modify the document at /item/:id to delete");
      req.flash('error_msg', 'Unable to find/modify post to delete with id: ' + item_id + '.');
      res.status(400).send({ "status": "error", "error": "Unable to find/modify post to delete with id: " + item_id + "at /item/" + item_id });
      return;
    }

    req.flash('success_msg','You successfully deleted the post.');
    res.status(200).send({"status": "OK"});
    return;
  });

  });
});

router.get('/search',function(req,res,next){
  res.render('search');
});

router.post('/search',function(req,res,next){
  console.log("executing search");
  const {timestamp,limit,username,following,q} = req.body;

  console.log("the paramaters are following value : " + following + "  query string = " + q);
  let search_limit = 25;
  let search_time = Date.now()/1000;
  //console.log("inside the search post");
  if(timestamp != null)
    search_time = timestamp;
  if(limit != null && limit > 0 && limit <= 100)
    search_limit = limit;

  if(limit > 100)
    search_limit = 100;

  let query_array = [{timestamp: {$lte: search_time}}];

  if(username != null)
    query_array.push({username : username});
  if(q != null && q != '' && !(/^\s+$/.test(q)))
    query_array.push({$text: {$search: q}});


  //users that current session user is following
  //let followers_array;
  if(req.session.username != null && following != null){
    console.log("accessed with user logged in and following ture");
    db.user.findOne({username:req.session.username}).then(result => {
      if(result == null)
      {
        //req.flash('error_msg', 'Unable to find username:' + username + '.');
        res.status(400).send({ "status": "error", "error": "Unable to find account with username " + username + " at /user/" + username });
        return;
      }
      let followers_array = result.following;
      let followers_query = [];
      console.log("Result of followers_array " + followers_array);
      for(let i = 0; i < followers_array.length; i++)
      {
        console.log("Executed inside here");
        followers_query.push({username: followers_array[i]});
      }
      //check following not empty
      console.log(followers_query);
      if(followers_query.length != 0)
        query_array.push({$or: followers_query});

      let sorter = {timestamp: -1};
  
      let query = {$and :query_array};
      db.post.find(query).sort(sorter).limit(search_limit).toArray(function(err,result){
        if(err)
        console.log("error in find /search " + err);
        //console.log("insode result " +result);
        //res.locals.results = result;
        res.status(200).send({"status": "OK","items":result});
        return;
    }); 
    });
  }
  else
  {
    console.log("user did not log in or following is false");
    let sorter = {timestamp: -1};
  
    let query = {$and :query_array};
    db.post.find(query).sort(sorter).limit(search_limit).toArray(function(err,result){
      if(err)
        console.log("error in find /search " + err);
      //console.log("insode result " +result);
      //res.locals.results = result;
      res.status(200).send({"status": "OK","items":result});
      return;
    });    
  }
});

router.post('/follow',function(req,res,next){

  console.log("following the parameters are user to follow " + req.body.username + " and current session user is " + req.session.username);
  const {username,follow} = req.body;
  let follow_value = true;
  if(follow != null)
  {
    follow_value = follow;
  }
  if(req.session.username == null)
  {
    req.flash('error_msg', 'Please log in to follow a user.');
    res.status(400).send({ "status": "error", "error": "User is not logged in to follow users" });
    return;
  }
  const query = { username: req.session.username};
  const options = {upsert:false};
  let updates;
  if(follow_value)
    updates = { $addToSet: {following: username}};
  else
    updates = { $pull: {following: username}};
  db.user.updateOne(query,updates,options).then(result =>{
    //console.log(result);
    if(result == null)
    {
      req.flash('error_msg', "Unable to find the username: " + username + " to follow");
      res.status(400).send({ "status": "error", "error": "result is null updateOne at /follow for user session " + req.session.username });
      return;
    }
    console.log("match count is " + result.matchedCount + "   modified count is " + result.modifiedCount);
    if(result.matchedCount != 1)
    {
      req.flash('error_msg', "Unable to find the username: " + username + " to follow");
      res.status(400).send({ "status": "error", "error": "matchCount is not one at updateOne at /follow for user session " + req.session.username });
      return;
    }
    /*
    if(result.modifiedCount != 1)
    {
      if(follow_value){
        req.flash('error_msg', "You are already following the user: " + username);
        res.status(400).send({ "status": "error", "error": "User is already following " + username +" at /follow for user session " + req.session.username });
        return;
      }else{
        req.flash('error_msg', "You already are not following the user: " + username);
        res.status(400).send({ "status": "error", "error": "User is not following " + username +" at /follow for user session " + req.session.username });
        return;
      }
    }
    */
    //success update followers on user being followed
    const follower_query = {username :username};
    let follower_update;
    if(follow_value)
      follower_update = { $addToSet: {followers: req.session.username}};
     else
      follower_update = { $pull: {followesr: req.session.username}};
    db.user.updateOne(follower_query,follower_update,options).then(result =>{
      if(result == null)
      {
        req.flash('error_msg', "Unable to find the username: " + username + " to update followers");
        res.status(400).send({ "status": "error", "error": "result is null updateOne at /follow for user to update follow " + username });
        return;
      }
      console.log("match count is " + result.matchedCount + "   modified count is " + result.modifiedCount);
      //console.log("result is " + result);
      if(result.matchedCount != 1)
      {
        req.flash('error_msg', "Unable to find the username: " + username + " to update followers");
        res.status(400).send({ "status": "error", "error": "matchCount is not one at updateOne at /follow for user " + username });
        return;
      }
      /*
      if(result.modifiedCount != 1)
      {
        req.flash('error_msg', "Unable to modify the username: " + username + " to update followers");
        res.status(400).send({ "status": "error", "error": "modified count is not one at updateOne at /follow for user  " + username });
        return;
      }
      */
      if(follow_value)
      {
        req.flash('success_msg','You are now following ' + username + '.');
        res.status(200).send({"status": "OK"});
        return;
      }
      else
      {
      req.flash('success_msg','You are now not following ' + username + '.');
      res.status(200).send({"status": "OK"});
      return;
      }
    });
    
  });
});






/**
 *  different url to view individual posts
 */
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



module.exports = router;
