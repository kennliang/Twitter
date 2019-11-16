var express = require('express');
var router = express.Router();
const shortid = require('shortid');
var fs = require('fs');
var multer = require('multer');
var upload = multer({dest: 'uploads/'});
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
/*
router.use(function(req,res,next){
  res.locals.authenticated = req.session.username;
  next();
});*/


//var db = require("../database/test.js");
var db = require('../app.js');

router.get('/search',function(req,res,next){
  res.render('search');
});

router.post('/search',function(req,res,next){
  const search = async function(req,res){
    try
    {
      const {timestamp,limit,username,following,q,hasMedia,rank,parent,replies} = req.body;
      console.log("the parameters of search is ",timestamp,limit,username,following,q,hasMedia,rank,parent,replies);
      let search_limit = 25;
      let search_time = Date.now()/1000;

      if(timestamp != null)
        search_time = timestamp;

      if(limit != null && limit > 0 && limit <= 100)
        search_limit = limit;

      if(limit > 100)
        search_limit = 100;

      let query_array = [{timestamp: {$lte: search_time}}];

      if(username != null && username != '')
        query_array.push({username : username});
      if(q != null && q != '' && !(/^\s+$/.test(q)))
        query_array.push({$text: {$search: q}});

      let has_media_query = false;
      if(hasMedia != null)
        has_media_query = hasMedia;
      if(has_media_query)
        query_array.push({media:{ $exists: true, $ne: [] }});

      //get followers of current signed in user if following is true
      if(req.session.username != null && following == true){
        console.log("accessed with user logged in and following ture");
        let result = db.user.findOne({username:req.session.username});
        if(result == null)
          throw new Error("Unable to find current logged in username in database at /search ")
       
        let followers_array = result.following;
        let followers_query = [];
        for(let i = 0; i < followers_array.length; i++)
          followers_query.push({username: followers_array[i]});
        if(followers_query.length != 0)
          query_array.push({$or: followers_query});
      }
      if(replies == false)
        query_array.push({replies: {$not :{$eq: "reply"}}});
      else if(replies == null || replies == true)
      {
        if(parent != null && parent != '')
        {
          //console.log("executed3wedsaweds");
          console.log(parent);
          query_array.push({parent:parent});
          //query_array.push({$and : [{parent : parent},{$or :[{child_Type: {$eq: "retweet"}},{child_Type:{ $eq:"reply"}}]}]  }  );
        }
      }

      let sorter = {total: -1};
      if(rank == "time")
        sorter = {timestamp: -1};
      let query = {$and :query_array};
      console.log(query_array);
      let result = await db.post.find(query).sort(sorter).limit(search_limit).toArray();
      if(result == null)
        throw new Error("Unable to perform search");
      console.log(result);
      res.status(200).send({"status": "OK","items":result});
    
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
  search(req,res);
});

module.exports = router;
