var express = require('express');
var router = express.Router();
const shortid = require('shortid');
var fs = require('fs');
//var multer = require('multer');
//var upload = multer({dest: 'uploads/'});
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

router.get('/item/:id',function(req,res,next){
  let get_item = async function(req,res){
    try
    {
      let item_id = req.params.id;
      //console.log("Get item with id " + item_id);
      /*
      let result = await db.post.findOne({id : item_id});
      if(result == null)
        throw new Error("Unable to find the post with id "+ item_id);*/
        
        const {body } = await search_client.search({
          index: 'game',
          type: 'posts',
          size: 1,
          body:{
            query:{
              term:{id: item_id}
            }
          }
        });
        if(body == null || body.hits.hits.length == 0)
          throw new Error("Unable to find the post with id "+ item_id);
        let result = body.hits.hits[0]._source;
        result.property.likes = result.likes;
      res.status(200).send({"status": "OK","item":result});
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  } 
  get_item(req,res);
});

router.delete('/item/:id',function(req,res,next){
  const delete_item = async function(req,res){
    try
    {
      let item_id = req.params.id;
      if(req.session.username == null)
        throw new Error("User is not logged in to delete item");
      
      //console.log("Deleting item with id " + item_id);
      /*
      let result = await db.post.findOneAndDelete({username: req.session.username,id:item_id});   
      if(result == null || result.value == null)
        throw new Error("Unable to find or delete the post with id "+ item_id);*/

      const {body } = await search_client.search({
        index: 'game',
        type: 'posts',
        size: 1,
        body:{
          query:{
            bool:{
              must:[
                {
                  term: {username:req.session.username}
                },
                {
                  term: {id:item_id}
                },
              ]
            }
          }
        }
      });
      if(body.hits.hits.length == 0)
        throw new Error("Unable to find or delete the post with id "+ item_id);

      await search_client.delete({
        id: item_id,
        index: 'game',
      
        type: 'posts'
      });

      let result = body.hits.hits[0]._source;
      let child_type = result.childType;
      const options = {upsert:false};
      if(child_type == "retweet")
      {
        /*
        const parent_query = {id: result.value.parent};
        const update_info = {$inc :{retweeted: -1}};
        let update_retweet = await db.post.updateOne(parent_query,update_info,options);
        if(update_retweet == null || update_retweet.matchedCount == 0 || update_retweet.modifiedCount == 0)
          throw new Error("Unable to find or update the parent post retweet count");*/
      }

      let media_array = result.media;
      if(media_array != null)
      {
        for(let i = 0; i < media_array.length; i++)
        {
          let query = 'DELETE FROM Media WHERE id = ?';
          await client.execute(query,[media_array[i]],{prepare:true});
        }
      }
      const query = { username: result.username};
      const update = { $pull: {posts: item_id}};
     
      let result2 = await db.user.updateOne(query,update,options);
      if(result2 == null || result2.matchedCount == 0 || result2.modifiedCount == 0)
        throw new Error("Unable to find and delete the post from the user");
      res.status(200).send({"status": "OK"});
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
  delete_item(req,res);
});


router.post('/item/:id/like',function(req,res,next){
  const like = async function(req,res){
    try
    {
      const {username} = req.session;
      const {like} = req.body;
      const {id} = req.params;
      if(username == null)
        throw new Error("User is not logged in to like a post");
  
        //let item_id = req.params.id;
        let like_status = true;
        if(like != null)
          like_status = like;

      
        const {body } = await search_client.search({
          index: 'game',
          type: 'posts',
          size: 1,
          body:{
            query:{
              term:{id: id},
            }
          }
        });
        if(body.hits.hits.length == 0)
          throw new Error("Unable to find post with id"+ id);
        
        let like_array = body.hits.hits[0]._source.likes;
        let num_likes = body.hits.hits[0]._source.properties.likes;
        let total = body.hits.hits[0]._source.total;
        let index_user = like_array.indexOf(username);
        
        if(like_status){
          if(index_user == -1){
            like_array.push(username);
            await search_client.update({
              index: 'game',
              type: 'posts',
              id: id,
              // type: '_doc', // uncomment this line if you are using {es} ≤ 6
              body: {
                  doc:{
                    'properties.likes': num_likes++,
                    total: total++,
                    likes: like_array
                  },
          
              },
            });

          }
          else
            throw new Error("User is already liking the post");
        }
        else{
          if(index_user != -1){
            like_array.splice(index_user,1);
            await search_client.update({
              index: 'game',
              type: 'posts',
              id: id,
              // type: '_doc', // uncomment this line if you are using {es} ≤ 6
              body: {
                  doc:{
                    'properties.likes': num_likes--,
                    total: total--,
                    likes: like_array
                  },
          
              },
            });
          }
          else
            throw new Error("User is already not liking the post");
        }
    

        //let result = await db.post.findOneAndUpdate(query,update_info,update_options);
        //if(result == null)
         // throw new Error("Unable to find and update item being liked with id " + id);
/*
         let result = await client.update({
          index: 'game',
          type: 'posts',
          id: id,
          body: {
            script : {
              source: "ctx._source.likes++;ctx._source.total++",
            }
          },
        });*/
       // console.log(result.body.get._source);
/*
        update_info = {$set:{"property.likes":result.value.likes.length,"total": result.value.likes.length + result.value.retweeted}};
        let result2 = await db.post.updateOne(query,update_info,options);
        if(result2 == null || result2.matchedCount == 0)
          throw new Error("Unable to update the item being liked with id " + id + "result is "+ result2);*/
        res.status(200).send({"status":"OK"});
    }
    catch(e){
      console.log("Try catch error at like "+ e);
      res.status(500).send({"status":"error","error":"Error thrown at like"+e});
    }
  }
  like(req,res);

});

module.exports = router;
