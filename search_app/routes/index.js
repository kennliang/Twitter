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
const { Client } = require('@elastic/elasticsearch');
const search_client = new Client({ node: 'http://152.44.37.67:9200' });
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
      //console.log("the parameters of search is ",timestamp,limit,username,following,q,hasMedia,rank,parent,replies);
      let search_limit = 25;
      let search_time = Date.now()/1000;

      if(timestamp != null)
        search_time = timestamp;

      if(limit != null && limit > 0 && limit <= 100)
        search_limit = limit;

      if(limit > 100)
        search_limit = 100;

      let must_querys = [
        {
          range: {timestamp: { "lte": search_time}}
        }
      ];

      let should_query = [];
      let must_not_query = [];


      if(username != null && username != '')
        must_querys.push({term: {username:'Bob'}});

      if(q != null && q != '' && !(/^\s+$/.test(q)))
        must_querys.push({match: { content: q }});

      let has_media_query = false;
      if(hasMedia != null)
        has_media_query = hasMedia;
      if(has_media_query)
        must_querys.push({exists: {field:"media"}});

     

      //get followers of current signed in user if following is true
      if(req.session.username != null && following == true){
        console.log("accessed with user logged in and following ture");
        let result = db.user.findOne({username:req.session.username});
        if(result == null)
          throw new Error("Unable to find current logged in username in database at /search ")
       
        let followers_array = result.following;
        //let followers_query = [];
        for(let i = 0; i < followers_array.length; i++)
          should_query.push({ term : {username : followers_array[i] } });
        //if(followers_query.length != 0)
         // query_array.push({$or: followers_query});
      }


      if(replies == false)
        must_not_query.push({term: {childType: 'reply'}});
      else if(replies == null || replies == true)
      {
        if(parent != null && parent != '')
        {
          //console.log("executed3wedsaweds");
          //console.log(parent);
          must_querys.push({match: {parent: 'myparent'}});
          //query_array.push({$and : [{parent : parent},{$or :[{child_Type: {$eq: "retweet"}},{child_Type:{ $eq:"reply"}}]}]  }  );
        }
      }

      let sorter = {total: "desc"};
      if(rank == "time")
        sorter = {timestamp: "desc"};

      //console.log(query_array);
      /*
      let result = await db.post.find(query).sort(sorter).limit(search_limit).toArray();
      if(result == null)
        throw new Error("Unable to perform search");*/
      //console.log(result);

      let boolean_query = {must:must_not_query};
      if(should_query.length != 0)
      {
        boolean_query.should = should_query;
        boolean_query.minimum_should_match = 1;
      }
      if(must_not_query.length != 0){
        boolean_query.must_not = must_not_query;
      }

      const { body } = await client.search({
        index: 'game',
        type: 'posts',
        size: search_limit,
        sort: sorter,
        // type: '_doc', // uncomment this line if you are using {es} ≤ 6
        body: 
        {
          query: 
          {
            bool: boolean_query
          }
        }
      });

      let result_array = [];
      let hit_array = body.hits.hits;
      for(let i = 0 ; i < hit_array.length ; i++){
        result_array.push(hit_array._source);
      }

      res.status(200).send({"status": "OK","items":result_array});
    
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
  search(req,res);
});

module.exports = router;
