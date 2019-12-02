var express = require('express');
var router = express.Router();
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

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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
});

var db = require('../app.js');



module.exports = router;
