var debate = require('../models/debate');

exports.makeDebate = function(res, req){
	var debate = new Debate();

	debate.topic = req.body.topic;
	debate.political = req.body.political;
	debate.type = req.body.type;
	debate.topicPre = req.body.topicPre;
	debate.sidesPre = req.body.sidesPre;
	debate.openPositions = req.body.openPositions;
	debate.namespace = "/d" + debate._id;
	debate.serious = req.body.serious;
	debate.state = 0;
	debate.userId = req.user._id;
	debate.debaters = [debate.user._id];
	debate.debaterLimit = 2;
	debate.observers = [];

	debate.save(function(err){
		if(err)
			res.send(err);

		res.json({message:"debate created successfully!", namespace: debate.namespace})
	})
}

exports.joinDebate = function(res, req){
	debate.findOne({_id: req.params.debate_id}, function(err, debate){
		if(err)
			res.send(err);

		if(debate.debaterLimit > debate.debaters.length){
			res.json({message:"joined "})
		}
	})
	
}

exports.getDebates = function(res, req){
	
}