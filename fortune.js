/**
 * @file Server running Escape the Conference app
 * @author Shubham SHARMA <shubham@sharma.fr>
 * based on the code of Nicolas Grenié <nicolas@3scale.net>
 */
var fs = require('fs');
const fortune = require('fortune')
const express = require('express');
const nedbAdapter = require('fortune-nedb')
const http = require('http')
const fortuneHTTP = require('fortune-http')
const microApiSerializer = require('fortune-micro-api')

const keenio = require('express-keenio');

const config = require('./config');

const app = express()
  , port = process.argv[2] || config.escape.port;

//Layout and views
app.use(express.static(__dirname + '/public'));

//Env
var ENV='';
if(process.env.NODE_ENV)
  ENV="-"+process.env.NODE_ENV;

//Keen
keenio.configure({ client: {
    projectId: config.keen.projectId,
    writeKey: config.keen.writeKey,
} });
keenio.on('error', console.warn);

//Fortune JS resources
const db = "./db";
const mazeAPI = fortune({
  maze: {
    name: String,
    logo: String,
    cells: [ Array('cell'), 'maze' ],
    start: 'cell',
    story: String,
    instructions: String,
    validate: String
  },
  cell: {
    name: String,
    content: String,
    readableId: Number,
    north: 'cell',
    east: 'cell',
    south: 'cell',
    west: 'cell',
    maze: ['maze', 'cells'],
  },
  validate: {
    code: String
  }
},
{
  adapter: [ nedbAdapter, {dbPath: db} ]
}
)

const options = {
  entryPoint: config.escape.baseUrl
}

const listener = fortuneHTTP(mazeAPI, {
  serializers: [
    [ microApiSerializer, options ]
  ]
})

app
  .get('/cell', keenio.trackRoute('errorCollection'+ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(403, '{"status": 403, "message":"That\'d be far too easy... don\'t you think"}')
  })
  .get('/maze/:id/cells', keenio.trackRoute('errorCollection'+ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(403, '{"status": 403, "message":"That\'d be far too easy... don\'t you think"}')
  })
  // override maze endpoints to remove cells array
  .get('/maze', keenio.trackRoute('indexCollection'+ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    mazeAPI.adapter.connect().then(function () {
        maze = mazeAPI.adapter.find('maze');
      return maze;
    }).then(function (resource) {
      if(resource){
        const mazeJSON = JSON.parse(fs.readFileSync('./data/mazes.json'));
        mazeJSON.graph[0].href = config.escape.baseUrl + "/maze/" + resource[0].id;
        mazeJSON.graph[0].id = resource[0]._id;
        mazeJSON.graph[0].name = resource[0].name;
        mazeJSON.graph[0].story = resource[0].story;
        mazeJSON.graph[0].instructions = resource[0].instructions;
        mazeJSON.graph[0].validate = resource[0].validate;
        mazeJSON.graph[0].logo = resource[0].logo;
        mazeJSON.graph[0].start.href = config.escape.baseUrl + "/maze/" + resource[0].id + "/start";
        mazeJSON.graph[0].start.id = resource[0].start;
        res.send(mazeJSON, null, 3)
      }
    })
  })
  .get('/maze/:id', keenio.trackRoute('indexCollection'+ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    mazeAPI.adapter.connect().then(function () {
        maze = mazeAPI.adapter.find('maze');
      return maze;
    }).then(function (resource) {
      if(resource){
        const mazeJSON = JSON.parse(fs.readFileSync('./data/maze.json'));
        mazeJSON.href = config.escape.baseUrl + "/maze/" + resource[0].id;
        mazeJSON.id = resource[0]._id;
        mazeJSON.name = resource[0].name;
        mazeJSON.story = resource[0].story;
        mazeJSON.instructions = resource[0].instructions;
        mazeJSON.validate = resource[0].validate;
        mazeJSON.logo = resource[0].logo;
        mazeJSON.start.href = config.escape.baseUrl + "/maze/" + resource[0].id + "/start";
        mazeJSON.start.id = resource[0].start;
        res.send(mazeJSON, null, 3)
      }
    })
  })
  .get('/cell/:id/maze', keenio.trackRoute('indexCollection'+ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    mazeAPI.adapter.connect().then(function () {
        maze = mazeAPI.adapter.find('maze');
      return maze;
    }).then(function (resource) {
      if(resource){
        const mazeJSON = JSON.parse(fs.readFileSync('./data/maze.json'));
        mazeJSON.href = config.escape.baseUrl + "/maze/" + resource[0].id;
        mazeJSON.id = resource[0]._id;
        mazeJSON.name = resource[0].name;
        mazeJSON.story = resource[0].story;
        mazeJSON.instructions = resource[0].instructions;
        mazeJSON.validate = resource[0].validate;
        mazeJSON.logo = resource[0].logo;
        mazeJSON.start.href = config.escape.baseUrl + "/maze/" + resource[0].id + "/start";
        mazeJSON.start.id = resource[0].start;
        res.send(mazeJSON, null, 3)
      }
    })
  })
  .get('/validate/:email/final/:token', keenio.trackRoute('validationCollection'+ENV), function (req, res) {
    if (req.params.token.toLowerCase() == config.escape.token.toLowerCase()) {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync('./data/valid-token.json'), null, 3)
    }
    else {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync('./data/invalid-token.json'), null, 3)
    }
  })
  .get('/validate/:email/:step/:answer', keenio.trackRoute('validationCollection'+ENV), function (req, res) {
    const step = parseInt(req.params.step)
    const answer = req.params.answer
    //console.log(config.escape.riddles[step], answer, step, req.params.email)

    if (answer == config.escape.riddles[step]) {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync('./data/valid-token.json'), null, 3)
    }
    else {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync('./data/invalid-token.json'), null, 3)
    }
  })

app.use(listener).listen(port);

console.log('Server running at http://127.0.0.1:'+port);
