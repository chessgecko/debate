var express = require('express');
var Debate = require('../models/debate');
var app = express();
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var clients = {};
var io;

exports.setio = function(theIO){
	io = theIO;
}


exports.getDebates = function(req, res){
	Debate.find({}, function(err, debates){
		//console.log('here');
		if(err)
			res.send(err);
		res.json(debates);
	});
}

exports.respondConnect = function(socket){
	console.log('connected');
	socket.on('joinDebate', function(msg){
		console.log('joinDebate');
		Debate.findOne({room: msg.room}, function(err, debate){
			if(err){
				console.log(err);
				return;
			}
			if(debate.debaters.indexOf(msg.username) != -1 || debate.observers.indexOf(msg.username) != -1){
				socket.emit("bad username", msg.username);
				return;
			}

			if(debate.debaterLimit > debate.debaters.length){
				debate.debaters.push(msg.username);
				debate.debaterSockets.push(socket.id);
				debate.markModified('debaters');
				debate.markModified('debaterSockets');
				debate.save();
				console.log("debate.room: " + debate.room.length);
				socket.join(debate.room);
				socket.broadcast.to(debate.room).emit('debater joined', {username: msg.username});
				// socket.br(debate.room).emit("joined room debater", {time:10000});

				socket.emit("joined room debater", {maxNum: debate.openPositions, users: debate.debaters, observers: debate.observers});
				
			} else if(debate.debaterLimit <= debate.debaters.length){
				debate.observers.push(msg.username);
				debate.observerSockets.push(socket.id);

				debate.markModified('observers');
				debate.markModified('observerSockets');
				debate.save();

				socket.join(debate.room);
				socket.broadcast.to(debate.room).emit('observer joined', {username: msg.username});
				socket.emit("joined room observer", {maxNum: debate.openPositions, users: debate.debaters, observers: debate.observers});
			}

			if(debate.debaterLimit <= debate.debaters.length){
				console.log("starting");
				for(var i = 0; i<debate.debaterSockets.length; i++){
					console.log("i: " + i + " sockid: " + socket.id);
					io.to(debate.debaterSockets[i]).emit('debate starting', i);
				}

				debate.state = 1;
				debate.markModified("state");
				debate.save();
				startDebate(debate);

			}
		});
});

socket.on('createDebate', function(msg){
	console.log('createDebate');
	//var debate = new Debate();
	var myDeb = {
		topic: msg.topic,
		political: msg.political,
		type: msg.type,
		topicPre: msg.topicPre,
		sidesPre: msg.sidesPre,
		openPositions: msg.openPositions,
		serious: msg.serious,
		state: 0,
		debaters: [msg.username],
		debaterSockets: [socket.id],
		room: "d" + socket.id,
		debaterLimit: 2,
		observers: [],
		observerSockets: [],
		speakerNum: 0,
		speakerKey: 0
	}
	Debate.collection.insert([myDeb], {}, function(err, docs){
		if(err){
			console.log(err);
		} else{
			console.log(docs);
			socket.join(docs[0].room);
			console.log('room: ' + docs[0].room);
			socket.emit("created debate", {debaters: [msg.username]});
		}
	});
	// debate.topic = msg.topic;
	// debate.political = msg.political;
	// debate.type = msg.type;
	// debate.topicPre = msg.topicPre;
	// debate.sidesPre = msg.sidesPre;
	// debate.openPositions = msg.openPositions;
	// debate.room = "d" + debate._id;
	// debate.serious = msg.serious;
	// debate.state = 0;
	// debate.debaters = [msg.username];
	// debate.debaterSockets = [socket];
	// debate.debaterLimit = 2;
	// debate.observers = [];
	// debate.observerSockets = [];
	// debate.speakerNum = 0;
	// debate.speakerKey = 0;

	// debate.save(function(err){
	// 	if(err){
	// 		console.log("err");
	// 		console.log(err);
	// 	}
	// 	//console.log("err");
	// 	socket.join(debate.room);
	// 	socket.emit("created debate", {debaters: debate.debaters});
	// });

});

  socket.on('sound blob', function(msg){
    io.emit('sound blob', msg);
  });

socket.on("send sound", function(msg){
	console.log('sound incoming');
	Debate.findOne({room:msg.room}, function(err, debate){
		if(err){
			console.log(err);
			return;
		}
		console.log("debate.speakerKey: " + debate.speakerKey);
		console.log(debate.speakerNum);
		socket.broadcast.to(msg.room).emit("send sound", msg.sound);
	})
});

socket.on("disconnect", function(){
	console.log("disconnect");
	Debate.find({}, function(err, debates){
		if(err){
			console.log(err);
		}
		for(var i = 0; i<debates.length; i++){
			console.log("delete: " + i);
			if(debates[i].debaterSockets.length == 1 && debates[i].debaterSockets[0] == socket.id){
				Debate.remove({debaterSockets:socket.id}, function(err){
					if(err){
						console.log("err remove");
						console.log(err);
					}
				});
			} else {
				for(var j = 0; j<debates[i].debaterSockets.length; j++){
					if(debates[i].debaterSockets[j] == socket.id) {
						var ind = debates[i].debaterSockets.indexOf(socket.id);
						debates[i].debaterSockets.splice(ind, 1);
						debates[i].debaters.splice(ind, 1);
						debates[i].markModified('debaterSockets');
						debates[i].markModified('debaters');

						debates[i].save();
					}
				}
			}
		}
	});
});

}

var startDebate = function(debate){
	console.log("thinking");
	console.log(debate.room);
	io.sockets.in(debate.room).emit("thinking time", {time:1000});
	setTimeout(startTalking, 1000, debate);
}

var startTalking = function(thedebate){
	console.log("speakerNum");
	Debate.findOne({room:thedebate.room}, function(err, debate){
		if(debate.speakerNum < debate.debaterLimit){
			io.sockets.in(debate.room).emit("talking time" , {snum:debate.speakerNum, time:15000});
			debate.speakerKey = Math.floor((Math.random() * 1000000) + 1); 

			debate.markModified('speakerKey');
			debate.save();

			debate.speaker =debate.debaters[debate.speakerNum];
			debate.markModified('speaker');
			debate.save();

			console.log("turn to speak: " + debate.speakerNum);
			io.to(debate.debaterSockets[debate.speakerNum]).emit("your turn to speak", {key:debate.speakerKey, room:debate.room});
			debate.speakerNum++;
			debate.markModified('speakerNum');
			debate.save();


			setTimeout(startTalking, 30000, debate);
			console.log('afterTimeout: ' + debate.speakerNum);
		} else {
			console.log("over");
			io.sockets.in(debate.room).emit("talking time" , {snum:debate.speakerNum, time:30000});
		}
	});
	
}


