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

router.use(function(req,res,next){
  res.locals.authenticated = req.session.username;
  next();
});


//var db = require("../database/test.js");
var db = require('../app.js');

/* GET home page. */
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
    
      //check media
      if(media != null && media.length != 0)
      {
        for(let i = 0; i < media.length ; i++)
        {
          let query = 'SELECT username,used FROM Media WHERE id = ?';
          let result = await client.execute(query,[media[i]],{prepare:true});
          if(result == null || result.rows[0] == null)
            throw new Error("Unable to find the media id" + media[i] + "from cassandra db at /additem");
          if(result.rows[0].username != username || result.rows[0].used == true)
            throw new Error("The associated id was not created by the user or it is already being used");
        }
      }

      if(childType != null)
      {
        if(childType == "retweet" && parent != null)
        {
          const query = {id: parent_id};
          const options = {upsert:false};
          const update_info = {$inc : {retweeted:1,total: 1}};
          let result = await db.post.updateOne(query,update_info,options);
          if(result == null || result.matchedCount == 0 || result.modifiedCount == 0)
            throw new Error("Unable to find or update the post tha was retweeted at /additem");
        }
        else if(childType == "reply" && parent != null)
        {
          let result = await db.post.findOne({id : parent_id});
          if(result == null)
            throw new Error("Unable to find the post that was replyed at /additem");
        }
        else
          throw new Error("Either childType is not correct string or parent is null at /additem");
      }

      //create item
      var postobj = { id: shortid.generate(),username: req.session.username,property : {likes : 0},retweeted: 0,content,
      timestamp : Date.now()/1000,parent: parent_id,media: media_array,likes:[],total: 0};

      db.post.insertOne(postobj);

      //update user
      const query = { username:req.session.username};
      const update_verified = { $push: {posts: postobj}};
      const options = {upsert:false};
      let result = await db.user.updateOne(query,update_verified,options);
      if(result == null || result.matchedCount == 0 || result.modifiedCount == 0)
        throw new Error("Unable to find or update the user's post at /additem");

      res.status(200).send({"status": "OK","id":postobj.id}); 
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
  add_item(req,res);
});

router.get('/item/:id',function(req,res,next){
  let get_item = async function(req,res){
    try
    {
      let item_id = req.params.id;
      //console.log("Get item with id " + item_id);
      let result = await db.post.findOne({id : item_id});
      if(result == null)
        throw new Error("Unable to find the post with id "+ item_id);
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
      let result = await db.post.findOneAndDelete({username: req.session.username,id:item_id});
      if(result == null || result.value == null)
        throw new Error("Unable to find or delete the post with id "+ item_id);

      let child_type = result.value.childType;
      const options = {upsert:false};
      if(child_type == "retweet")
      {
        const parent_query = {id: result.value.parent};
        const update_info = {$inc :{retweeted: -1}};
        let update_retweet = await db.post.updateOne(parent_query,update_info,options);
        if(update_retweet == null || update_retweet.matchedCount == 0 || update_retweet.modifiedCount == 0)
          throw new Error("Unable to find or update the parent post retweet count");
      }
      
      let media_array = result.value.media;
      for(let i = 0; i < media_array.length; i++)
      {
        let query = 'DELETE FROM Media WHERE id = ?';
        let result = await client.execute(query,[media_array[i]],{prepare:true});
      }
      const query = { username: result.value.username};
      const update = { $pull: {posts: result.value}};
     
      let result = await db.user.updateOne(query,update,options);
      if(result == null || result.matchedCount == 0 || result.modifiedCount == 0)
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

router.get('/search',function(req,res,next){
  res.render('search');
});

router.post('/search',function(req,res,next){
  const search = async function(req,res){
    try
    {
      const {timestamp,limit,username,following,q,hasMedia,rank,parent,replies} = req.body;
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
        query_array.push({media:{$not:{$size : 0}}});

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
      let sorter = {total: -1};
      if(rank == "time")
        sorter = {timestamp: -1};
      let query = {$and :query_array};
      let result = await db.post.find(query).sort(sorter).limit(search_limit).toArray();
      if(result == null)
        throw new Error("Unable to perform search");
      res.status(200).send({"status": "OK","items":result});
      
      /*(function(err,result){
        if(err)
        console.log("error in find /search " + err);
        //console.log("insode result " +result);
        //res.locals.results = result;
        res.status(200).send({"status": "OK","items":result});
        return;
    }); */
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
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
      let result = await db.user.updateOne(query,updates,options);
      if(result == null || result.matchedCount == 0)
        throw new Error("Unable to find the current user at /follow");
  
      res.status(200).send({"status": "OK"});
    }
    catch(e){
      console.log(e);
      res.status(500).send({"status":"error","error": e});
    }
  }
});


/*
  Milestone 3 routes
*/

router.get('/addmedia',function(req,res,next){

  res.render('upload');
});

router.post('/addmedia',upload.single('content'),function(req,res,next){
  const addMedia = async function(req,res) {
    try
    {
      const {username} = req.session;
      if(username == null)
        console.log("cool");
        //res.status(400).send({"status":"error","error":"The user must be logged in to add media"});
      //else
      //{
        console.log(req.file['path']);
        //fs.unlink(req.file['path']);
        let unlink = util.promisify(fs.unlink);
        let read = util.promisify(fs.readFile);
        //console.log(res);
      
        
        let data = await read(req.file['path']);
        let media_id = shortid.generate();
      
        let query = 'INSERT into Media (id,content,used,username) VALUES (?,?,?,?)';
        const result = await client.execute(query,[media_id,data,false,username],{prepare:true});
        await unlink(req.file['path']);
        res.status(200).send({"status":"OK","id":media_id});
      //}
    }
    catch(e){
      console.log("Try catch error at addmedia "+ e);
      res.status(400).send({"status":"error","error":"Error thrown at addmedia"+e});
    }
  }
  addMedia(req,res);
});

router.get('/media/:id',function(req,res,next){
  let get_media = async function(req,res){
    try
    {
      let media_id = req.params.id;
      let query = 'SELECT content FROM Media WHERE id = ?';
      let result = await client.execute(query,[media_id],{prepare:true});
      if(result == null || result.rows[0] == null)
        throw new Error("Unable to get media from cassandra db");
        res.status(200).send(result.rows[0].content);
    }
    catch(e){
      console.log("Try catch error at addmedia "+ e);
      res.status(400).send({"status":"error","error":"Error thrown at get media"+e});
    }
  }
  get_media(req,res);
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

        const query = { id: id};
        const options = {upsert:false};

        let update_info;
        if(like_status)
          update_info = { $addToSet:{likes: username}};
        else
          update_info = { $pull: {likes: username}};

        let result = await db.post.findOneAndUpdate(query,update_info,options);
        if(result == null)
          throw new Error("Unable to find and update item being liked with id " + id);

        update_info = {$set:{"property.likes":result.value.likes.length,total: result.value.likes.length + result.value.retweeted}};
        let result = await db.post.updateOne(query,update_info,options);
        if(result == null || result.matchedCount == 0,result.modifiedCount == 0)
          throw new Error("Unable to update the item being liked with id " + id)

        res.status(200).send({"status":"OK"});
    }
    catch(e){
      console.log("Try catch error at addmedia "+ e);
      res.status(400).send({"status":"error","error":"Error thrown at like"+e});
    }
  }
  like(req,res);

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
