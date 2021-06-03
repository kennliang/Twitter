
<br />
<p align="center">
  <h3 align="center">Twitter Clone</h3>

  <p align="center">
    A Twitter API designed for hands-on learning building scalable distributed systems using free open source technologies.
  </p>
</p>



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
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#system-design">System Design</a></li>
    <li><a href="#tests-and-todos">Tests and TODOs</a></li>

  </ol>
</details>

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

<!-- GETTING STARTED -->
## Getting Started

### API Documentation



### Installation

1. To run the microservices (suffix with "app"), clone the repo, cd into each app, npm install and run with PM2

2. To install MongoDB, Elasticsearch, Redis, Nginx, and PM2, visit the installation or documentation of each technology.

* https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html
* https://docs.mongodb.com/manual/installation/
* https://pm2.keymetrics.io/docs/usage/quick-start/
* https://redis.io/topics/quickstart
* https://www.nginx.com/resources/wiki/start/

## System Design
 
 TODO

## Tests and TODOs

### Tests 
The system passed a course instructor's correctness and scalability test (10k simulated concurrent users with 200k API requests).

TODO - Writing own correctness and scalability test.

### TODO
1. Writing own correctness and scalability test
2. Reduce the manual install and deployment required by the project using deployment tools like docker and ansible
3. Create a frontend app for our API



