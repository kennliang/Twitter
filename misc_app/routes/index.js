var express = require('express');
var router = express.Router();
const shortid = require('shortid');
var fs = require('fs');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});cd
const cassandra = require('cassandra-driver');
const util = require('util');

const client = new cassandra.Client({
  contactPoints: ['130.245.168.184'],
  localDataCenter: 'datacenter1',
  keyspace:'twitter_media',
}); 
client.connect(function(err){
  if(err)
    console.log("Error occured connecting " + err);
  console.log("successful connection");
  console.log('Connected to cluster with %d host(s): %j', client.hosts.length, client.hosts.keys());
});
const { Client } = require('@elastic/elasticsearch');
const search_client = new Client({ node: 'http://152.44.37.110:9200' });

/*
router.use(function(req,res,next){
  res.locals.authenticated = req.session.username;
  next();
});*/


//var db = require("../database/test.js");
var db = require('../app.js');

router.get('/', function(req, res, next) {
  
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

let test = 0;

router.post('/additem',function(req,res,next){
  const add_item = async function(req,res){
    try
    {
      const {content, childType,parent,media} = req.body;
      const {username} = req.session;
      if(username == null)
        throw new Error("User is not logged in to add item at /additem")
      if(content == null)
        throw new Error("Missing content parameters at /additem")
      test++;
      //check media
      let date_now = Date.now();
      console.log(test+"Before Media ");
      if(media != null && media.length != 0)
      {
        for(let i = 0; i < media.length ; i++)
        {
          let query = 'SELECT username,used FROM Media WHERE id = ?';
          let result = await client.execute(query,[media[i]],{prepare:true});
          console.log(result.rows[0]);
          if(result == null || result.rows[0] == null)
            throw new Error("Unable to find the media id" + media[i] + "from cassandra db at /additem");
          if(result.rows[0].username != username || result.rows[0].used == true)
            throw new Error("The associated id was not created by the user or it is already being used");
        }
        for(let i = 0; i < media.length ; i++)
        {
          let query = 'UPDATE Media SET used = ? WHERE id = ?';
          let result = await client.execute(query,[true,media[i]],{prepare:true});
        }
      }
      date_now = Date.now() - date_now;
      console.log(test+"After Media " + now_date);

      if(childType != null && childType != '')
      {
        if(childType == "retweet" && parent != null)
        {
          /*
          const query = {id: parent};
          const options = {upsert:false};
          const update_info = {$inc : {retweeted:1,total: 1}};
          let result = await db.post.updateOne(query,update_info,options);
          if(result == null || result.matchedCount == 0 || result.modifiedCount == 0)
            throw new Error("Unable to find or update the post tha was retweeted at /additem");*/
          
            await search_client.update({
              index: 'game',
              type: 'posts',
              id: parent,
              body: {
                script : {
                  source: "ctx._source.total++;ctx._source.retweeted++",
                }
              },
            });
        }
        else if(childType == "reply" && parent != null)
        {
          
          let results = await db.post.findOne({id : parent});
          if(results == null)
            throw new Error("Unable to find the post that was replyed at /additem");
          /*
          const {body } = await search_client.search({
            index: 'game',
            type: 'posts',
            size: 1,
            body:{
              query:{
                term:{id: parent}
              }
            }
          });
          if(body == null || body.hits.hits.length == 0)
            throw new Error("Unable to find the post that was replyed at /additem");*/
        }
        else
          throw new Error("Either childType is not correct string or parent is null at /additem");
      }
      date_now = Date.now() - date_now;
      console.log(test+"After checks " + now_date);


      //console.log(test+"After checks " + Date.now()/1000);
      
      let media_value = [];
      if(media != null)
        media_value = media;
      let new_id = shortid.generate();
      console.log()

      await search_client.index({
        index: 'game',
        type: "posts",
        id:new_id,
        // type: '_doc', // uncomment this line if you are using {es} ≤ 6
        body: {
          id: new_id,
          username: req.session.username,
          content: content,
          media: media_value,
          timestamp: Date.now()/1000,
          childType: childType,
          parent: parent,
          retweeted: 0,
          property: {likes:0},
          total:0,
          likes: []
        }
      });
      //create item
      //console.log(test+"After index " + Date.now()/1000);
      date_now = Date.now() - date_now;
      console.log(test+"After Index " + now_date);

      
      var postobj = { id: new_id,username: req.session.username,property : {likes : 0},retweeted: 0,content,
      timestamp : Date.now()/1000,childType: childType,parent: parent,media: media_value,likes:[],total: 0};

      db.post.insertOne(postobj);

      //update user
      const query = { username:req.session.username};
      const update_verified = { $push: {posts: new_id}};
      const options = {upsert:false};
      let result = await db.user.updateOne(query,update_verified,options);
      if(result == null || result.matchedCount == 0 || result.modifiedCount == 0)
        throw new Error("Unable to find or update the user's post at /additem");

      //console.log(test+"After everything " + Date.now()/1000);
      date_now = Date.now() - date_now;
      console.log(test+"After Everything " + now_date);

      res.status(200).send({"status": "OK","id":new_id}); 
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
  add_item(req,res);
});

router.post('/follow',function(req,res,next){
  const follow = async function(req,res){
    try
    {
      const {username,follow} = req.body;
      let follow_value = true;
      if(follow != null)
        follow_value = follow;
      if(req.session.username == null)
        throw new Error("User is not logged in to follow other users");

      //check to see if user being followed exist and update
      const follower_query = {username :username};
      const options = {upsert:false};
      let follower_update;
      if(follow_value)
        follower_update = { $addToSet: {followers: req.session.username}};
      else
        follower_update = { $pull: {followers: req.session.username}};

      let result = await db.user.updateOne(follower_query,follower_update,options);
      if(result == null || result.matchedCount == 0)
        throw new Error("Unable to find the user being followed");
      
      const query = { username: req.session.username};
      let updates;
      if(follow_value)
        updates = { $addToSet: {following: username}};
      else
        updates = { $pull: {following: username}};
      let result2 = await db.user.updateOne(query,updates,options);
      if(result2 == null || result2.matchedCount == 0)
        throw new Error("Unable to find the current user at /follow");
  
      res.status(200).send({"status": "OK"});
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
  follow(req,res);
});


/*
  Milestone 3 routes
*/

router.get('/addmedia',function(req,res,next){

  res.render('upload');
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

router.get('/follow',function(req,res,next){
  res.render('follow');
});

router.get('/delete',function(req,res,next){
  res.render('deleteitem');

});


module.exports = router;
