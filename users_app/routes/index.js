var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

var db = require('../app.js');

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
      if(media_array != null)
      {
        for(let i = 0; i < media_array.length; i++)
        {
          let query = 'DELETE FROM Media WHERE id = ?';
          await client.execute(query,[media_array[i]],{prepare:true});
        }
      }
      const query = { username: result.value.username};
      const update = { $pull: {posts: result.value.id}};
     
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

        const query = { id: id};
        const update_options = {upsert:false,returnOriginal: false};
        const options = {upsert:false};

        let update_info;
        if(like_status)
          update_info = { $addToSet:{likes: username}};
        else
          update_info = { $pull: {likes: username}};

        let result = await db.post.findOneAndUpdate(query,update_info,update_options);
        if(result == null)
          throw new Error("Unable to find and update item being liked with id " + id);
        update_info = {$set:{"property.likes":result.value.likes.length,"total": result.value.likes.length + result.value.retweeted}};
        let result2 = await db.post.updateOne(query,update_info,options);
        if(result2 == null || result2.matchedCount == 0 || result2.modifiedCount == 0)
          throw new Error("Unable to update the item being liked with id " + id)
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
