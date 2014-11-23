// Load required packages
var mongoose = require('mongoose');

// Define our beer schema
var DebateSchema   = new mongoose.Schema({
  name: String, //title of the debate
  type: String, //parli, ethical dilemma, presidential
  political: Boolean, //is the debate political?(no:0, yes:1)
  topic: String, //topic of the debate
  sidesPre, Boolean, //are the sides set by the server or by the creator beforehand (0/1)
  openPositions: String, //description of the side other can have
  namespace: String, //namespace of the debate
  serious: Number, //lower number less serious 1-4
  state: Number, //0 not started, 1 in progress, 2 finished
  userId: String
});

// Export the Mongoose model
module.exports = mongoose.model('Beer', BeerSchema);