var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var i = 0;

// app.engine('html', require('ejs').renderfile);

io.on('connection', function(socket){

  socket.on('sound blob', function(msg){
    console.log(i);
    i++;
    io.emit('sound blob', msg);
  });

});

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
  console.log(__dirname);
});

app.get('/js', function(req, res){
	res.sendFile(__dirname + '/views/hear.html');
});
app.get('/hear', function(req, res){
	res.sendFile(__dirname + '/views/hear.html');
});

app.use(express.static(__dirname + '/public'));

app.get('/send', function(req, res){
	res.sendFile(__dirname + '/views/send.html');
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});