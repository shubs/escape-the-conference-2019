Escape the conference
========

Escape the conference was part of the second Escape the Conference game during APIDAYS Paris conference, in December 2019.

Attendees of the conference were invited to solve some riddles that were hidden in the venue.

To help them find the riddles, we created this Hypermedia Maze. The API gives them instructions of what to look for and some of the maze's cells contain clues of where the riddles are hidden.
The concatenation of the riddles solutions forms a token that could be validated with the API.

The project is largely based on [@picsoung](https://github.com/picsoung)'s work [APIbunny](https://github.com/picsoung/apibunny)

## Play with the maze
http://maze.apidays.io

## Dependencies
* [node](http://nodejs.org/)
* [npm](https://github.com/npm/npm)
* [fortune.js](http://fortune.js.org/)
* [express-keenio](https://github.com/sebinsua/express-keenio)
* [sync](https://github.com/0ctave/node-sync)

## How does it work

Maze data are stored in `/data/uber-maze.js`.
`fortune_init.js` launch the API with no restrictions
`mazes.js` reads the info from maze data file and call the API to create the maze in database
`fortune.js` launch the protected version of the API. The one to be run in production

By default we use `nedb` check the [Fortune.js guide](http://fortune.js.org/guide/#adapter-interface) to change it.

Databases are stored in `/db`

## Config
To track calls in the API we use [Keen.io](http://keen.io) Analytics API. In `config.js` you will need to add your Keen.io keys to make it work.

You will also have to change `privateKey` variable to your own, it's used to generate a hash when users have finished the maze.

In this config file you can also configure the baseUrl of your API or the port where it will be available.

## Install

```shell
git clone https://github.com/shubs/escape-the-conference-2019
cd escape-the-conference
npm install
node fortune_init.js
```

in another terminal to create the maze
```shell
node mazes.js
```

Kill fortune_init.js and launch the "protected" version

```
node fortune.js
```

Now your game is ready !
