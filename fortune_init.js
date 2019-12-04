/**
 * @file Server running Escape the Conference app, to launch to init maze
 * @author Shubham SHARMA <shubham@sharma.fr>
 * based on the code of Nicolas Grenié <nicolas@3scale.net>
 */

const fortune = require('fortune')
const express = require('express');
const partials = require('express-partials');
const nedbAdapter = require('fortune-nedb');

const container = express()
  , port = process.argv[2] || 3000;

const db = "./db";

//Fortune JS resources
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

const http = require('http')
const fortuneHTTP = require('fortune-http')

const listener = fortuneHTTP(mazeAPI, {
  serializers: [
      fortuneHTTP.JsonSerializer,
      fortuneHTTP.HtmlSerializer,
      fortuneHTTP.FormDataSerializer,
      fortuneHTTP.FormUrlEncodedSerializer
  ],
})

const server = http.createServer((request, response) =>
  listener(request, response)
  .catch(error => { console.log(error) }))

server.listen(port)

console.log('Server running at http://127.0.0.1:'+port);