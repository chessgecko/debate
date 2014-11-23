// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var DebateSchema   = new mongoose.Schema({
  							
  type: String, 			//parli, ethical dilemma, presidential
  political: Boolean, 		//is the debate political?(no:0, yes:1)
  topic: String, 			//topic of the debate
  topicPre: Boolean,		//topic determined beforehand
  sidesPre: Boolean, 		//are the sides set by the server or by the creator beforehand (0/1)
  openPositions: String, 	//description of the side other can have
  room: String, 			//namespace of the debate
  serious: Number, 			//lower number less serious 1-4
  state: Number, 			//0 not started, 1 in progress, 2 finished
  turn: Number,				//the turn of the debate
  debaterLimit: Number, 	//should be determined from the type
  // userId: String,		 	//id of the person who created the debate
  debaters: Array, 			//usernames of the people debating, including the creator
  debaterSockets: Array,	//sockets of debaters
  observers: Array, 		//ids of people observing the debate
  observerSockets: Array,	//sockets of observers

});

// Export the Mongoose model
module.exports = mongoose.model('Debate', DebateSchema);