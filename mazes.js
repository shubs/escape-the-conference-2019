/**
 * @file Creates maze in database from a javascript and a json file.
 * @author Shubham SHARMA <shubham@sharma.fr>
 * based on the code of Nicolas Grenié <nicolas@3scale.net>
 */

const http = require('http');
const fs = require('fs');
const Sync = require('sync');
const folder = process.cwd()+'/data/';

const config = require('./config');
const HOST = config.escape.host,
      PORT = config.escape.port;
const BASE_URL = config.escape.baseUrl

const maze_name ="uber-maze";
var maze;

Sync(function(){
	var start_time = Date.now();
	console.log("Start: " + start_time);
  try {
    const name = "Escape the Conference"
    const logo = BASE_URL + "/img/logo.png"
    const story = "The dark and evil Middleware has stolen all the API knowledge and locked it up in a safe. Find the clues and solve all its riddles to save us all!"
    const instructions = "Loose yourself in the maze, wonder in the cells to find the riddles. Solve the riddles and find each part of the lost token"
    const validate = BASE_URL + "/validate/:email/final/:token"
    const result = createMaze.sync(null, name, logo, story, instructions, validate)
	maze = result.records[0];
	console.log(result)
    const rawMaze = getFileMaze(maze_name);
    //Add Cells
    addCellsToDb.sync(null,rawMaze,maze);
    var mazedb = getMazeDB.sync(null, maze.id);
    var db_cells = mazedb.records[0].cells;
    var maze_cells = rawMaze.cells;

  }
  catch (e) {console.error(e)}
  for(var i=0;i<db_cells.length;i++){
    try{
    	var cell = httpGet.sync(null, "/cell",db_cells[i]).records[0];
    	var maze_cell = maze_cells['cell'+cell.readableId];
    	var doors = maze_cell.doors;
    	var data =[];

    	//north
    	if(doors[0]!==0){
    		var north_id = doors[0];
    		var neigborCell = maze_cells['cell'+north_id];
        data = {"id": cell.id, "replace": {"north": neigborCell.id}};
        data = JSON.stringify(data);
        httpPatch.sync(null,'/cell',cell.id,data);
    	}
    	//east
    	if(doors[1]!==0){
    		var east_id = doors[1];
    		var neigborCell = maze_cells['cell'+east_id];
    		data = {"id": cell.id, "replace": {"east": neigborCell.id}};
        data = JSON.stringify(data);
        httpPatch.sync(null,'/cell',cell.id,data);
    	}
    	//south
    	if(doors[2]!==0){
    		var south_id = doors[2];
			var neigborCell = maze_cells['cell'+south_id];
    		data = {"id": cell.id, "replace": {"south": neigborCell.id}};
        data = JSON.stringify(data);
        httpPatch.sync(null,'/cell',cell.id,data);
    	}
    	//west
    	if(doors[3]!==0){
    		var west_id = doors[3]
    		var neigborCell = maze_cells['cell'+west_id];
    		data = {"id": cell.id, "replace": {"west": neigborCell.id}};
        data = JSON.stringify(data);
        httpPatch.sync(null,'/cell',cell.id,data);
    	}

    }
    catch (e) {console.error(e)}
  }

  try {
    //Init start point
	var data = '{"id": "' + mazedb.records[0].id +'" , "replace": { "start": "' +maze_cells['cell1'].id  +'" }}'
    httpPatch.sync(null,'/maze', mazedb.records[0].id, data);
    console.log('End - executed in '+ (Date.now()-start_time)+"ms");
  }
  catch (e) {console.error(e)}
});


/**
* Retrieve specific maze from DB
* @param {string} id - ID of the maze in Database
* @param {function} cb - Callback
*/
function getMazeDB(id,cb){
	try{
		httpGet('/maze',id,cb);
	}catch(ex){
		console.log(ex);
		return undefined;
	}
}

/**
* Add maze cells to maze resource
* @param {maze} mazeObject - The mazeObject extracted from .js file
* @param {resource} mazeDb - Maze object from fortune.js resource
* @param {function} cb - Callback
*/
function addCellsToDb(mazeObject,mazeDb,cb){
	var cells = mazeObject.cells;

  for(var i =1; i<=Object.keys(cells).length;i++){
    var c = cells['cell'+i];
    var newDbCell = createCell.sync(null, c, i, mazeDb);
    c.id = newDbCell.records[0].id;
	}
	cb(null,cells); //return new table of cells
}

/**
* Add cell to a maze in the database
* @param {cell} cell - Cell object read from .js file
* @param {string} id - ID of the cell in the maze
* @param {maze} maze - Maze object from DB
* @callback {function} cb - callback
*/
function createCell(cell, readable_id, maze, cb){
	try{
		var data = '{"name":"'+cell.name+'","content":"'+cell.content+'","readableId":"'+readable_id+'","maze":"'+maze.id+'","type":"cell"}'
		httpPost('/cell',data,cb);
	}catch(ex){
		console.log(ex);
		return undefined;
	}
}

/**
* Create maze in database
* @param {string} name - Name of the Maze
* @param {string} logo - Logo of the Maze
* @param {string} story - Story of Escape the Conference
* @param {string} instructions - Instructions
* @param {string} validate - Validate URL
* @callback {function} cb - callback
*/
function createMaze(name, logo, story, instructions, validate, cb){
	try{
		var data ='{"name":"'+name+'", "logo":"'+logo+'", "story":"'+story+'", "instructions":"'+instructions+'", "validate":"'+validate+'"}';
		httpPost('/maze',data,cb);
	}catch(ex){
		console.log(ex);
		return undefined;
	}
}

/**
* Extract maze structure from a .js file
* @param {string} filename - Name of the Maze file
*/
function getFileMaze(filename) {
    try {
        return JSON.parse(fs.readFileSync(folder+filename+'.js'));
    }
    catch(ex) {
        return ex;
    }
}

/**
* Function to perform a HTTP PATCH request
* @param {string} path - Endpoint to be called
* @param {string} integer - ID of the ressource to patch
* @param {json} data - Data to send
* @param {function} cb - Callback
*/
function httpPatch(path,id,data,cb){
  var options = {
      host: HOST,
      port: PORT,
      path: path+'/'+id,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        "Content-Length":Buffer.byteLength(data, 'utf-8')
    }
  };
  var req = http.request(options, function (res) {
    var chunks = [];

    res.on("data", function (chunk) {
      chunks.push(chunk);
    });

    res.on("end", function () {
      var body = Buffer.concat(chunks);
      cb(null,body.toString());
    });
  });

  req.write(data);
  req.end();
}

/**
* Function to perform a HTTP GET request
* @param {string} path - Endpoint to be called
* @param {string} integer - ID of the ressource
* @param {function} cb - Callback
*/
function httpGet(path,id,cb){
	var options = {
	    host: HOST,
	    port: PORT,
	    path: path+'/'+id,
	    method: 'GET',
	    headers: {
	      'Content-Type': 'application/json'
		}
	};

	var req = http.request(options, function(response) {
	  response.setEncoding('utf8');
	  var res_data;
	  response.on('data', function (chunk) {
	    res_data = chunk;
	  });
	  response.on('end', function() {
		cb(null,JSON.parse(res_data));
	  });
	});

	req.on('error', function(e) {
	  console.log('problem with request GET: path: ' + path + 'message :' + e.message);
	});


	req.end();
}

/**
* Function to perform a HTTP POST request
* @param {string} path - Endpoint to be called
* @param {json} data - Data to send 
* @param {function} cb - Callback
*/
function httpPost(path,data,cb){
	var options = {
	    host: HOST,
	    port: PORT,
	    path: path,
	    method: 'POST',
	    headers: {
	      'Content-Type': 'application/json',
        'Content-Length': data.length
	    }
	};

	var httpreq = http.request(options, function (response) {
		response.setEncoding('utf8');
		var res_data;
		response.on('data', function (chunk) {
		  res_data = chunk;
    });
    response.on('end', function() {
			console.log(res_data)
		  cb(null,JSON.parse(res_data));
		});
	});

	httpreq.on('error', function(e) {
	  console.log('problem with request POST: path: ' + path + '; message :' + e);
	});

	httpreq.write(data);
	httpreq.end();
}