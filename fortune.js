/**
 * @file Server running Escape the Conference app
 * @author Shubham SHARMA <shubham@sharma.fr>
 * based on the code of Nicolas Grenié <nicolas@3scale.net>
 */
var fs = require('fs');
const fortune = require('fortune')
const express = require('express');
const nedbAdapter = require('fortune-nedb')
var mongoose = require('mongoose');
const http = require('http')
const fortuneHTTP = require('fortune-http')
const microApiSerializer = require('fortune-micro-api')

const keenio = require('express-keenio');

const config = require('./config');

mongoose.connect(config.mongo, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false });
var mdb = mongoose.connection;
mdb.on('error', console.error.bind(console, 'MongoDB connection error:'));

const app = express()
  , port = process.argv[2] || config.escape.port;

function getLevel(levels) {
  return levels.filter(level => level === true).length
}

function buildSuccessMessage(user, level) {
  var percentage = Math.round(getLevel(user.levels) / 7 * 100)
  var obj = {
    "message": "Well done, you've found the right answer for Level " + level,
    "email": user.email,
    "completion": percentage + '%',
    "info": "Make sure to add a Gravatar image for your email https://gravatar.com/"
  }
  if (percentage == 100)
    obj.next = "you can now validate the final token /validate/:email/final/:token"
  return obj
}
function buildFailMessage(user, level) {
  var percentage = Math.round(getLevel(user.levels) / 7 * 100)
  var obj = {
    "status": 403,
    "message": "Not the right answer...",
    "email": user.email,
    "completion": percentage + '%',
  }
  return obj
}

//Layout and views
app.use(express.static(__dirname + '/public'));

// CORS
app.use(function (req, res, next) {
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
const userSchema = new mongoose.Schema({
  email: String,
  levels: Array(Boolean),
  validationAttempts: Number,
  validationTimestamps: Array(Number),
  creationTimestamp: Number,
  totalLevelsTimestamps: Object
});
const User = mongoose.model("User", userSchema);


async function getUser(email) {
  return await User.find({ email: email }).then((u) => {
    if (u != [])
      return u[0]
    else {
      return null
    }
  })
}

const usersStore = fortune({
  user: {
    email: String,
    levels: Array(Boolean),
    validationAttempts: Number,
    validationTimestamps: Array(Number),
    creationTimestamp: Number,
    totalLevelsTimestamps: Object
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
    const email = req.params.email
    if (req.params.token.toLowerCase() == config.escape.token.toLowerCase()) {
      var objSuccess = {
        "message": "Well done, you've found the right token! Keep it for you!",
        "instructions" : "Go to the Escape the Conference booth and tell the password",
        "password" : "I think the vault should be open, because I am here to bring you the right token",
        "email":email
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(objSuccess, null, 3)
    }
    else {
      var objFail = {
        "status": 403,
        "message": "Not the right token",
        "email":email,
        "hint": "{Riddle#0}-{Riddle#1}-{Riddle#2}-{Riddle#3}-{Riddle#4}-{Riddle#5}-{Riddle#6}"
      }
      res.setHeader('Content-Type', 'application/json');
      res.send(objFail, null, 3)
    }
  })
  .get('/validate/:email/:step/:answer', keenio.trackRoute('validationCollection' + ENV), function (req, res) {
    const step = parseInt(req.params.step)
    const answer = req.params.answer
    const email = req.params.email

    // si email existe alors grab le users sinon le create

    getUser(email)
      .then(u => {
        if (u)
          return u
        else {
          var levels = [false, false, false, false, false, false, false]
          var validationTimestamps = [0, 0, 0, 0, 0, 0, 0]
          const totalLevelsTimestamps = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null }
          const creationTimestamp = Date.now()
          newUser = { "email": email, "levels": levels, validationAttempts: 1, 'validationTimestamps': validationTimestamps, creationTimestamp: creationTimestamp, totalLevelsTimestamps: totalLevelsTimestamps }

          return User.create(newUser).then(u => u)
        }
      })
      .then(u => {
        u.validationAttempts++
        if (answer == config.escape.riddles[step]) {

          u.levels[step] = true
          // Only update validation timestamp if not validated before
          if (u.validationTimestamps[step] === 0) u.validationTimestamps[step] = Date.now()
          const totalUserLevel = getLevel(u.levels)
          //console.log('TOTAL USER LEVEL ' + totalUserLevel)
          // Only update timestamp of level arrival if first time
          if (u.totalLevelsTimestamps[totalUserLevel] === null) u.totalLevelsTimestamps[totalUserLevel] = Date.now()
          //console.log(u.totalLevelsTimestamps)
          mesageToSend = buildSuccessMessage(u, step)
        }
        else {
          mesageToSend = buildFailMessage(u, step)
        }
        User.findByIdAndUpdate({
          _id: u.id
        }, u, (err, response) => {
          res.setHeader('Content-Type', 'application/json');
          res.send(mesageToSend, null, 3)
        });
      })
  })
  .get('/users', keenio.trackRoute('indexCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    User.find({}, function (err, users) {
      res.send(users);
    });
  })
  .get('/users/flush', keenio.trackRoute('indexCollection' + ENV), function (req, res) {
    res.setHeader('Content-Type', 'application/json');

    User.deleteMany({}, function (err) {
      res.send('removed all')
    });
  })

app.use(listener).listen(port);

console.log('Server running at http://127.0.0.1:' + port);
