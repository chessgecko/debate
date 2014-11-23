var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var passport = require('passport');
var debateController = require('./controllers/debate');
//var i = 0;

// app.engine('html', require('ejs').renderfile);

io.on('connection', function(socket){
  socket.on('sound blob', function(msg){
    io.emit('sound blob', msg);
  });
});

// Use the body-parser package in our application
app.use(bodyParser.urlencoded({
  extended: true
}));

var router = express.Router();

router.route('/joinDebate')
  .get(debateController.joinDebate);
  .post(debateController.makeDebate);

router.route('/debates')
  .get(debateController.getDebates);

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

app.use('/debate', router);


http.listen(3000, function(){
  console.log('listening on *:3000');
});