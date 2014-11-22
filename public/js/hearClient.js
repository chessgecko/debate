// variables
var leftchannel = [];
var rightchannel = [];
var recorder = null;
var recording = false;
var recordingLength = 0;
var volume = null;
var audioInput = null;
var sampleRate = 44100;
var audioContext = null;
var context = null;
var outputElement = document.getElementById('output');
var outputString;
var shouldPlay = false;
var socket = io();
var blobs = [];

soundManager.setup({
	url: '.',
	onready: function() {

	},
	ontimeout: function() {
    			// Hrmm, SM2 could not start. Missing SWF? Flash blocked? Show an error, etc.?
    			alert('ontimeout');
    		}
    	});

// when key is down
window.onkeydown = function(e){

    // if R is pressed, we start recording
    if ( e.keyCode == 82 ){
        shouldPlay = true;
        setTimeout(blobPlayTimerF, 1000);
    } else if ( e.keyCode == 83 ){
        shouldPlay = false;
    }
}
function playBlob(blob){
    outputElement.innerHTML = 'Handing off the file now...';
    console.log(blob);
    var soundUrl = (window.URL || window.webkitURL).createObjectURL(blob);
    var link = window.document.createElement('a');
    var mySound = soundManager.createSound({
        url: soundUrl,
        onfinish: function(){
            if(blobs.length > 1){
                blobs = blobs.slice(1,blobs.length);
                playBlob(blobs[0]);
            } else {
                blobs = blobs.slice(1,blobs.length);
                blobPlayTimerF();
            }
        }
    });
    mySound.play();
}

socket.on('sound blob', function(blob){
    blobs.push(blob);
});

function blobPlayTimerF(){
    if(shouldPlay){
        if(blobs.length > 0){
            playBlob(blobs[0]);
        } else{
            setTimeout(blobPlayTimerF, 300);
        }
    }
}