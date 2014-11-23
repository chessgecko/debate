var express = require('express');
var debate = require('../models/debate');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

exports.getDebates = function(res, req){
	debate.find({}, function(err, debates){
		if(err)
			res.send(err);
		res.json(debates);
	});
}

io.on('connection', function(socket){
	socket.on('joinDebate', function(msg){
		debate.findOne({room: debate.room}, function(err, debate){
			if(err){
				console.log(err);
				return;
			}
			if(debate.debaterLimit > debate.debaters.length){
				debate.debaters.push(msg.username);
				debate.debaterSockets.push(socket);
				socket.join(debate.room);
				socket.broadcast.to(debate.room).emit('observer joined', {username: msg.username});
				socket.emit("joined room debater", {maxNum: debate.openPositions, users: debate.debaters, observers: debate.observers});
			}
			if(debate.debaterLimit >= debate.debaters.length){
				debate.observers.push(msg.username);
				debate.observerSockets.push(socket);
				socket.join(debate.room);
				socket.broadcast.to(debate.room).emit('observer joined', {username: msg.username});
				socket.emit("joined room observer", {maxNum: debate.openPositions, users: debate.debaters, observers: debate.observers});
			}
		});
	});

	socket.on('createDebate', function(msg){
		var debate = new Debate();
		debate.topic = msg.topic;
		debate.political = msg.political;
		debate.type = msg.type;
		debate.topicPre = msg.topicPre;
		debate.sidesPre = msg.sidesPre;
		debate.openPositions = msg.openPositions;
		debate.room = "d" + debate._id;
		debate.serious = msg.serious;
		debate.state = 0;
		debate.debaters = [msg.username];
		debate.debaterSockets = [socket];
		debate.debaterLimit = 2;
		debate.observers = [];
		debate.observerSockets = [];

		debate.save(function(err){
			if(err)
				res.send(err);
			socket.emit("created message", {debaters: debate.debaters, });
			socket.join(debate.room);
		});
	});
});


