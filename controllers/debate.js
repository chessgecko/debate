var express = require('express');
var debate = require('../models/debate');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

exports.getDebates = function(req, res){
	debate.find({}, function(err, debates){
		if(err)
			res.send(err);
		res.json(debates);
	});
}

io.on('connection', function(socket){
	socket.on('joinDebate', function(msg){
		debate.findOne({room: msg.room}, function(err, debate){
			if(err){
				console.log(err);
				return;
			}
			if(debate.debaters.indexof(msg.username) != -1 || debate.observers.indexof(msg.username) != -1){
				socket.emit("bad username", msg.username);
				return;
			}
			if(debate.debaterLimit > debate.debaters.length){
				debate.debaters.push(msg.username);
				debate.debaterSockets.push(socket);
				debate.markModified('debaters');
				debate.markModified('debaterSockets');
				debate.save();
				socket.join(debate.room);
				socket.broadcast.to(debate.room).emit('observer joined', {username: msg.username});
				socket.emit("joined room debater", {maxNum: debate.openPositions, users: debate.debaters, observers: debate.observers});
			} else if(debate.debaterLimit >= debate.debaters.length){
				debate.observers.push(msg.username);
				debate.observerSockets.push(socket);

				debate.markModified('observers');
				debate.markModified('observerSockets');
				debate.save();

				socket.join(debate.room);
				socket.broadcast.to(debate.room).emit('observer joined', {username: msg.username});
				socket.emit("joined room observer", {maxNum: debate.openPositions, users: debate.debaters, observers: debate.observers});
			}
			if(debate.debaterLimit == debate.debaters.length){
				for(var i = 0; i<debate.debaterSockets.length; i++){
					debate.debaterSockets[i].emit("debate starting", i);
				}
				debate.state = 1;
				debate.markModified("state");
				debate.save();
				startDebate(debate);
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
	debate.speakerNum = 0;
	debate.speakerKey = 0;
	debate.save(function(err){
		if(err)
			res.send(err);
		socket.join(debate.room);
		socket.emit("created debate", {debaters: debate.debaters});
	});
});

	socket.on("send sound", function(msg){
		debate.findOne({room:msg.room}, function(err, debate){
			if(err){
				console.log(err);
				return;
			}
			if(debate.speakerKey != msg.speakerKey){
				console.log("invalid speaker key");
				return;
			}
			debate.debaterSockets[debate.speakerNum].broadcast.to(msg.room).emit("send sound", msg.sound);
		})
	});

});

var startDebate = function(debate){
	io.sockets.in(debate.room).emit("thinking time", {time:10000});
	setTimeout(startTalking(debate), 10000);
}

var startTalking = function(debate){
	if(debate.speakerNum < debate.maxNum){
		io.sockets.in(debate.room).emit("talking time" , {snum:debate.speakerNum, time:15000});
		debate.speakerKey = Math.floor((Math.random() * 1000000) + 1); 
		debate.speaker =debate.debaters[debate.speakerNum];
		debate.markModified('speaker');
		debate.markModified('speakerKey');
		debate.save();
		debate.debaterSockets[debate.speakerNum].emit("your turn to speak", {key:debate.speakerKey});
		debate.speakerNum++;
		debate.markModified('speakerNum');
		debate.save();
		setTimeout(startTalking(debate), 15000);
	} else {
		io.sockets.in(debate.room).emit("debate over" , {snum:debate.speakerNum, time:15000});
	}
}


