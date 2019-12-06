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

// CORS
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
//Env
var ENV = '';
if (process.env.NODE_ENV)
  ENV = "-" + process.env.NODE_ENV;

//Keen
keenio.configure({
  client: {
    projectId: config.keen.projectId,
    writeKey: config.keen.writeKey,
  }
});
keenio.on('error', console.warn);

//Fortune JS resources
const db = "./db";

const usersStore = fortune({
  user: {
    email: String,
    levels: Array(Boolean),
    validationAttempts: Number,
    validationTimestamps: Array(Number),
    creationTimestamp: Number
  }
},
  {
    adapter: [nedbAdapter, { dbPath: db }]
  }
)
const mazeAPI = fortune({
  maze: {
    name: String,
    logo: String,
    cells: [Array('cell'), 'maze'],
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
    adapter: [nedbAdapter, { dbPath: db }]
  }
)

const options = {
  entryPoint: config.escape.baseUrl
}

const listener = fortuneHTTP(mazeAPI, {
  serializers: [
    [microApiSerializer, options]
  ]
})

app
  .get('/cell', keenio.trackRoute('errorCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(403, '{"status": 403, "message":"That\'d be far too easy... don\'t you think"}')
  })
  .get('/maze/:id/cells', keenio.trackRoute('errorCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(403, '{"status": 403, "message":"That\'d be far too easy... don\'t you think"}')
  })
  // override maze endpoints to remove cells array
  .get('/maze', keenio.trackRoute('indexCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    mazeAPI.adapter.connect().then(function () {
      maze = mazeAPI.adapter.find('maze');
      return maze;
    }).then(function (resource) {
      if (resource) {
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
  .get('/maze/:id', keenio.trackRoute('indexCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    mazeAPI.adapter.connect().then(function () {
      maze = mazeAPI.adapter.find('maze');
      return maze;
    }).then(function (resource) {
      if (resource) {
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
  .get('/cell/:id/maze', keenio.trackRoute('indexCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    mazeAPI.adapter.connect().then(function () {
      maze = mazeAPI.adapter.find('maze');
      return maze;
    }).then(function (resource) {
      if (resource) {
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
  .get('/validate/:email/final/:token', keenio.trackRoute('validationCollection' + ENV), function (req, res) {
    if (req.params.token.toLowerCase() == config.escape.token.toLowerCase()) {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync('./data/valid-token.json'), null, 3)
    }
    else {
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync('./data/invalid-token.json'), null, 3)
    }
  })
  .get('/validate/:email/:step/:answer', keenio.trackRoute('validationCollection' + ENV), function (req, res) {
    const step = parseInt(req.params.step)
    const answer = req.params.answer
    const email = req.params.email

    // si email existe alors grab le users
    //sinon le creer
    usersStore.adapter.connect().then(function () {
      var options = { match: { "email": email } }
      u = usersStore.find('user', null, options)
      return u
    }).then((result) => {
      if (result.payload.count != 0) {
        console.log('User', email, 'found!')
        var userResource = (result.payload.records[0])
        return userResource
      }
      else {
        console.log('User not found.. Creation of ', email)
        var levels = [false, false, false, false, false, false, false]
        var validationTimestamps = [0, 0, 0, 0, 0, 0, 0]
        const creationTimestamp = Date.now()
        userResource = usersStore.create('user', { "email": email, "levels": levels, validationAttempts: 1, 'validationTimestamps': validationTimestamps, creationTimestamp: creationTimestamp})
          .then((resource) => resource.payload.records[0])
        return userResource
      }
    }).then((user) => {

      user.validationAttempts++
      if (answer == config.escape.riddles[step]) {
        user.levels[step] = true
        user.validationTimestamps[step] = Date.now()
        mesageToSend = './data/valid-token.json'
      }
      else {
        mesageToSend = './data/invalid-token.json'
      }
      updateOptions = {
        id: user.id,
        replace: { levels: user.levels, validationAttempts: user.validationAttempts, validationTimestamps: user.validationTimestamps }
      }
      usersStore.update('user', updateOptions).then((r) => {
        console.log('User Updated', r.payload.records[0].email, r.payload.records[0].levels, r.payload.records[0].validationAttempts)
      })
      res.setHeader('Content-Type', 'application/json');
      res.send(fs.readFileSync(mesageToSend), null, 3)
    })

  })
  .get('/users', keenio.trackRoute('indexCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    usersStore.adapter.connect().then(function () {
      users = usersStore.adapter.find('user');
      return users;
    }).then(function (resource) {

      res.send(resource, null, 3)

    })
  })

app.use(listener).listen(port);

console.log('Server running at http://127.0.0.1:' + port);
