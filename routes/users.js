var express = require('express');
var router = express.Router();
var db = require("../database/test.js");

/* GET users listing. */
router.get('/', function(req, res, next) {
  //console.log(dbes.consum);
  /*
  var myobj = { name: "test", address: "fish" };
  dbes.consum.insertOne(myobj,function(err,res){
    if(err) throw err;
    console.log("inserted document");
    //console.log("list of collections " + testdb.listCollections());
});*/
  res.send('respond with a resource');
});

module.exports = router;
