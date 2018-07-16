

var http    = require('http'),
    io      = require('socket.io'),
    fs      = require('fs'),
    _       = require('underscore');

var spawn = require('child_process').spawn;

var filename = process.argv[2];
if (!filename) return util.puts("Usage: node <server.js> <filename>");

// -- Node.js Server ----------------------------------------------------------

server = http.createServer(function(req, res){
  res.writeHead(200, {'Content-Type': 'text/html'})
  fs.readFile(__dirname + '/index.html', function(err, data){
    res.write(data, 'utf8');
    res.end();
  });
})
server.listen(8000);


var io = io.listen(server);

io.on('connection', function(client){
  console.log('Client connected');
  var tail = spawn("tail", ["-f", filename]);
  client.send( { filename : filename } );

  tail.stdout.on("data", function (data) {
    d = data.toString('utf-8').split(',')
    mac=d[6];
    type=d[12]
    name = d[7]
    if (type=="Probe"){
          client.send( { "mac": mac,"name":name } )
    }
  }); 

});

console.log('Server running at http://0.0.0.0:8000/, connect with a browser to see tail output');