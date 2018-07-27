
var promise = require('bluebird');
var http    = require('http'),
    io      = require('socket.io'),
    fs      = require('fs'),
    _       = require('underscore');

var spawn = require('child_process').spawn;
var nodes=[]
var ssids=[]
var links=[]
var filename = process.argv[2];
var path = require('path');

if (!filename) return util.puts("Usage: node <server.js> <filename>");

// -- Node.js Server ----------------------------------------------------------

server = http.createServer(function (request, response) {
    console.log('request starting...');

    var filePath = '.' + request.url;
    if (filePath == './')
        filePath = './index.html';

    var extname = path.extname(filePath);
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
    }

    fs.readFile(filePath, function(error, content) {
        if (error) {
            if(error.code == 'ENOENT'){
                fs.readFile('./404.html', function(error, content) {
                    response.writeHead(200, { 'Content-Type': contentType });
                    response.end(content, 'utf-8');
                });
            }
            else {
                response.writeHead(500);
                response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                response.end(); 
            }
        }
        else {
            response.writeHead(200, { 'Content-Type': contentType });
            response.end(content, 'utf-8');
        }
    });

})
server.listen(8000);


var io = io.listen(server);

io.on('connection', function(client){
  var tail = spawn("tail", ["-f", filename]);

  tail.stdout.on("data", function (data) {
    d = data.toString('utf-8').split(',')
    type=d[12]
    mac=d[6].split(":")
    mac.splice(-1)
    mac.splice(-1)
    mac.splice(-1)
      mac.splice(-1)
      mac.splice(-1)


    mac = mac.join(":")
    ssid=d[7].split('\n')[0]
    check = ssid.split("Spectrum")
    if (ssid!="BROADCAST" && ssid!="SpectrumWIFI" && ssid!="optimumwifi" && ssid!="xfinitywifi" && ssid!="CableWiFi" && ssid!="optimumwifi_Passpoint" && ssid!="SpectrumWiFi" && check.length == 1){

      if (type=="Probe"){ 
            handleLinks({"mac":mac,"ssid":ssid})
            ssidLinks(ssid,mac).then(function(ml){
              sendSSID(ssid,client).then(function(s){
                if (ml.length > 1){
                  sendNodes(ml,client).then(function(d){
                    sendLinks(ml,client).then(function(q){

                    }) 
                  })

                }
              })
            })
            
      }
    }
  }); 

});

function sendNodes(ml,client){
  var promises = _.map(ml, function(item) {
      return new Promise(function(resolve,reject){
         
         resolve(client.emit("message", { "type": "node","name":item.mac }))

      })
  });
  return Promise.all(promises);
}
function sendLinks(ml,client){
  var promises = _.map(ml, function(item) {
      return new Promise(function(resolve,reject){
        client.emit("message", { "type": "link","name":item })
        resolve()  


      })
  });
  return Promise.all(promises);
}
function ssidLinks(ssid,mac){
  return new Promise(function(resolve,reject){
      h = _.where(links, {"ssid":ssid})
      l = _.where(links, {"mac":mac})
      resolve(l)
  })
}

function handleLinks(l){
  c = _.any(links, function(link){ return _.isEqual(link, l); }); 
  if (!c){
    links.push(l)
  }
}
function sendSSID(ssid,client){
  console.log(ssid)
  return new Promise(function(resolve,reject){
          resolve(client.emit("message", { "type": "ssid","name":ssid } ))

  })

}
function nodeExists(mac){
  c = _.contains(nodes, mac)
  if (!c){
    nodes.push(mac)
    return false

  }else{
    return true
  }
}
console.log('Server running at http://0.0.0.0:8000/, connect with a browser to see tail output');