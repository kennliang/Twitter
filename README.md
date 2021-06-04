
<br />
<p align="center">
  <h3 align="center">Twitter REST API</h3>

  <p align="center">
    A Twitter REST API designed for scalability.
  </p>
</p>

***

<!-- TABLE OF CONTENTS -->
<details open="open">
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#api-documentation">API Documentation</a>
       <ul>
        <li><a href="#usercreation-app">Usercreation app</a></li>
        <li><a href="#item-app">Item app</a></li>
        <li><a href="#users-app">Users app</a></li>
        <li><a href="#search-app">Search app</a></li>
        <li><a href="#media-app">Media app</a></li>
        <li><a href="#misc-app">Misc app</a></li>
      </ul>
    </li>
    <li><a href="#installation">Installation</a></li>
    <li><a href="#system-design">System Design</a></li>
    <li><a href="#tests-and-todos">Tests and TODOs</a></li>

  </ol>
</details>


***

<!-- ABOUT THE PROJECT -->
## About The Project
This project is a Twitter Clone REST API designed to learn about scalable distributed systems and REST services using free open source technologies.

Based on the system design, the system handled up to 10k concurrent simulated users and a total of 200k API requests. To have a accurate scalability test, no more than 20 vCPU machines are necessary to pass the test.


### Built With

* [Express.js](https://expressjs.com/) Node.js web application framework
* [MongoDB](https://www.mongodb.com//) NoSQL database system
* [Nginx](https://www.nginx.com/) Load balancer and reverse proxy
* [Elasticsearch](https://www.elastic.co/) Full-text search engine
* [Redis](https://redis.io/) In-memory data store used as a cache
* [PM2](https://pm2.keymetrics.io/) Process manager for Node.js

***

## API Documentation

## Usercreation app 

```http
POST /adduser
```
Registers a new user and sends verification code to email.
| Request Parameter  | Description                 | Type    |
|--------------------|-----------------------------|---------|
| username           | (unique) username of user   | string  |
| email              | (unique) email of user      | string  |
| password           | (unique) password of user   | string  |

<!--
| Response Parameter | Description                 | Type    |
|--------------------|-----------------------------|---------|
| status             | "ok" or "error"             | string  |
| error              | error message               | string  |
-->

<!--
<details>
<summary><b>Sample Request</b></summary>
</details>
<details>
<summary><b>Sample Response</b></summary>
</details>
<br>
-->

```http
POST /login
```
Login user and sets session cookie.
| Request Parameter  | Description        | Type    |
|--------------------|--------------------|---------|
| username           | username of user   | string  |
| password           | password of user   | string  |

```http
POST /logout
```
Log out user.

```http
POST /verify
```
Account cannot be in use until verified.
| Request Parameter  | Description        | Type    |
|--------------------|--------------------|---------|
| email              | email of user      | string  |
| key                | verification key   | string  |

***

## Item app

```http
POST /additem
```
An item is a "tweet", "retweet", or "reply". Authentication Required.
| Request Parameter | Description                                                   | Type   |
|-------------------|---------------------------------------------------------------|--------|
| content           | body of item                                                  | string |
| childType         | (Optional) "retweet" or "reply". null if a. "tweet"           | string |
| parent            | (Optional) item ID of original tweet being reply or retweeted | string |
| media             | (Optional) array of media IDs                                 | Object |


| Response Parameter | Description        | Type    |
|--------------------|--------------------|---------|
| id                 | id of item         | string  |

```http
GET /item/:id
```
Gets contents of an item ID. 

```json
{
  "item": {
    "id": "item2",
    "username": "usertest1",
    "property":{
      "likes": 2,
    },
    "retweeted": 1,
    "content": "body of item (original content if retweet)",
    "timestamp": 1622770962,
    "childType": "retweet",
    "parent": "item1",
    "media": ["media1","media2"],
  }
}
```

```http
DELETE /item/:id
```
Delete item ID with any associated media ID. Child posts (replys and retweets) are not deleted. Authentication Required.

```http
POST /item/:id/like
```
Like or unlike an item. Authentication Required

| Request  Parameter | Description                                        | Type    |
|--------------------|----------------------------------------------------|---------|
| like               | True = like False = dislike </br>**Default: True** | boolean |


***
## Users app

```http
GET /user/:username
```
Get username profile information

```json
{
  "user": {
    "email": "test1@stonybrook.edu",
    "followers": 5,
    "following": 2,
  }
}
```

```http
GET /user/:username/posts
```
Get a list of items (posts) user has made

| Request Parameter   | Description                                                  | Type |
|--------------------|-------------------------------------------------------------|------|
| limit              | number of posts to return. </br>**Default: 50, max of 200** | int  |

| Response Parameter | Description       | Type   |
|--------------------|-------------------|--------|
| items              | list of posts IDs | object |



```http
GET /user/:username/followers
```
Get a list of users following user

| Request Parameter | Description                                                     | Type |
|-------------------|-----------------------------------------------------------------|------|
| limit             | number of usernames to return. </br>**Default: 50, max of 200** | int  |

| Response Parameter | Description       | Type   |
|--------------------|-------------------|--------|
| users              | list of usernames | object |



```http
GET /user/:username/following
```
Get a list of users the user is following

| Request Parameter | Description                                                     | Type |
|-------------------|-----------------------------------------------------------------|------|
| limit             | number of usernames to return. </br>**Default: 50, max of 200** | int  |

| Response Parameter | Description       | Type   |
|--------------------|-------------------|--------|
| users              | list of usernames | object |

```http
POST /follow
```
Follow or unfollow a user. Authentication Required

| Request Parameter | Description                                        | Type    |
|-------------------|----------------------------------------------------|---------|
| like              | True = like False = dislike </br>**Default: True** | boolean |

***

## Search app
```http
POST /search
```
Search for items based on request parameters.

| Request Parameter | Description                                                                                                                          | Type      |
|-------------------|--------------------------------------------------------------------------------------------------------------------------------------|-----------|
| timestamp         | (Optional) search items from this time and earlier (Unix time)</br>**Default: Current Time**                                         | int/float |
| limit             | (Optional) number of items to return</br>**Default: 25, max 100 items**                                                              | int       |
| q                 | (Optional) string to be search in content. (Full-text search)                                                                        | string    |
| username          | (Optional) filter by username                                                                                                        | string    |
| following         | (Optional) shows items made by users that the logged in user follows</br>**Default: True**>                                          | boolean   |
| rank              | (Optional) Order returned items by "time" or by "interest"(weighting time vs number of likes and retweets)</br>**Default: interest** | string    |
| parent            | (Optional) return items made in reply to requested item ID(include retweets) </br>**Default: none**                                  | string    |
| replies           | (Optional) include reply items. If false, items that are replies should be excluded</br>**Default: True**                            | boolean   |
| hasMedia          | (Optional) return items with media only. If true, exclude all items that do not have associated media</br>**Default: false**         | boolean   |

| Response Parameter | Description                            | Type    |
|--------------------|----------------------------------------|---------|
| items              | array of items (see /item/:id)         | object  |

***

## Media app

```http
POST /addmedia
```
Add media file. (E.g. images,videos)

| Request Parameter | Description                           | Type    |
|-------------------|---------------------------------------|---------|
| content           | binary content of file being uploaded | binary  |

| Response Parameter | Description                          | Type    |
|-------------------|---------------------------------------|---------|
| id                | id of uploaded media file             | string  |

```http
GET /media/:id
```
Get media file by id

| Response Parameter | Description                   | Type    |
|------------------- |-------------------------------|---------|
| filename           | media file                    | binary  |

***

## Misc app

Contains development endpoints
```http
POST /reset
```
Reset database systems

***

### Installation

1. To run the microservices (suffix with "app"), clone the repo, cd into each app, npm install and run with PM2

2. To install MongoDB, Elasticsearch, Redis, Nginx, and PM2, visit the installation or documentation of each technology.

* https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
* https://docs.mongodb.com/manual/installation/
* https://pm2.keymetrics.io/docs/usage/quick-start/
* https://redis.io/topics/quickstart
* https://www.nginx.com/resources/wiki/start/

***
## System Design
 
 TODO

***
## Tests and TODOs

### Tests 
The system passed a course instructor's correctness and scalability test (10k simulated concurrent users with 200k API requests).

***TODO - Writing own correctness and scalability test.


### TODO
1. Writing own correctness and scalability test
2. Reduce the manual install and deployment required by the project using deployment tools like docker and ansible
3. Create a frontend app for our API
4. Add monitoring service (ELK stack)
5. Add security practices. (e.g sanitize input)



