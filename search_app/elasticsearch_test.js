const { Client } = require('@elastic/elasticsearch');
const client = new Client({ node: 'http://152.44.37.67:9200' });


async function run () {


    await client.indices.delete({
        index: 'game'});
        
    await client.indices.create({
        index: 'game'
    });

    const {body} = await client.search({
      index:'game',
      type:'posts',
      body:{
        "query": {
          "match_all": {}
      }
      }
    });

    console.log(body.hits.hits)

  

    await client.indices.putMapping({
        index: 'game',
        type: 'posts',
        body:{
            posts:
            {
              properties: 
              {
                id: {type:'keyword'},
                username: {type: 'keyword'},
                content: {type: 'text'},
                media:{type: 'keyword'},
                timestamp:{type:'double'},
                childType: {type: 'keyword'},
                parent: {type: 'keyword'},
                retweeted: {type: 'integer'},
                total: {type:'integer'},
                likes: {type:'keyword'}
              }
          }
        }
    });
   // console.log("done");
    
  /*
  let result = await client.indices.getMapping({
    index: 'game',
    type: 'posts',
    include_type_name: true,
  });
  console.log(result.body.game.mappings.posts.properties);
  console.log(result.body.game.mappings.posts.properties.character);
  console.log(result.body.game.mappings.posts.properties.quote);*/

/*
  await client.index({
    index: 'game',
    id: 'myid',
    type: "posts",
    // type: '_doc', // uncomment this line if you are using {es} ≤ 6
    body: {
      id: 'ok',
      username: 'Bob',
      content: 'I am the of blood the dragon.',
      media: ["123"],
      timestamp: 1575562376.614,
      childType: 'replys',
      parent: 'myparent',
      retweeted: 3,
      likes:3
    }
  });
  let result = await client.update({
    index: 'game',
    type: 'posts',
    id: 'myid',
    _source: true,
    body: {
      script : {
        source: "ctx._source.likes++;ctx._source.retweeted++",
      }
    },
  });*/
 // console.log(result.body.get._source);
  //await client.indices.refresh({ index: 'game-of-thrones' });
 // console.log("ok");
 /*
  await client.update({
    index: 'game',
    type: 'posts',
    id: 'myid',
    // type: '_doc', // uncomment this line if you are using {es} ≤ 6
    body: {
        doc:{
      character: 'Daenerys Targaryen',
      quote: 'I am the blood of the dragon.'
        },

    },
   
  });*/
  //console.log("ok");
  /*
  await client.index({
    index: 'game',
    type: 'posts',
    // type: '_doc', // uncomment this line if you are using {es} ≤ 6
    body: {
      id:'myid',
      username: 'John',
      content: 'A mind needs books blood like a sword needs a whetstone.',
      media: ["4334"],
      timestamp: 1075562376.614,
      childType: 'replys',
      parent: 'myparent',
      retweeted: 3,
      likes:4,
    }
  });

  // We need to force an index refresh at this point, otherwise we will not
  // get any result in the consequent search
  await client.indices.refresh({ index: 'game' })*/
/*
  console.log("ok");
  const {body } = await client.search({
    index: 'game',
    type: 'posts',
    size: 1,
    body:{
      query:{
        term:{username: 'John'}
      }
    }
  });*/
  // Let's search!
  /*
  const { body } = await client.search({
    index: 'game',
    type: 'posts',
    size: 2,
    sort: {timestamp: "desc"},
    // type: '_doc', // uncomment this line if you are using {es} ≤ 6
    body: 
    {
      query: 
      {
        bool:
        {
          must:[
            
            {
              term: {username:'Bob'}
            },
            {
              exists: {field:"media"}
            },
            {
              match: { content: 'blood' }
            },
            {
              range: {timestamp: { "lte": 1875562376.614}}
            },
            {
              match: {parent: 'myparent'}
            }
          ],
          must_not:[
            {
               term: {childType: 'reply'}
            }
          ],
          should : [
            { term : {username : "Bob" } },
            { term : {username : "John" } }
          ],
          minimum_should_match : 1,
        }
      }
    }
  });
  */
/*
  let se =await client.delete({
    id: 'myid',
    index: 'game',
  
    type: 'posts'
  });
  console.log(se);
  */
  /*
let  = await client.deleteByQuery({
    index: 'game',
    type: 'posts',
    wait_for_completion: true,
    refresh: true,
    size: 1,
    _source: 'true',
    search_type: 'query_then_fetch',
    body: {
        query: {
           term: {id:'myid'}
        }
    }
});

//await client.indices.refresh({ index: 'game' });
console.log(se.body);
console.log(se.meta);
const {body } = await client.search({
  index: 'game',
  type: 'posts',
  size: 1,
  body:{
    query:{
      term:{id: 'myid'}
    }
  }
});
console.log(body.hits.hits)
*/

/*
await client.indices.delete({
    index: 'game-of-thrones'
});*/

 // console.log(body.hits.hits)
}

run().catch(console.log)