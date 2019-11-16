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

router.post('/addmedia',upload.single('content'),function(req,res,next){
  const addMedia = async function(req,res) {
    try
    {
      const {username} = req.session;
      if(username == null)
        throw new Error("the user must be logged in to add media");
      
      let unlink = util.promisify(fs.unlink);
      let read = util.promisify(fs.readFile);
  
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

var db = require('../app.js');

module.exports = router;
