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
var shouldRecord = false;
var blobs = [];
var soundURLs = [];
var sounds = [];


//socket stuff
var speakerKey = 0;
var room = "";
var socket = io();


var daroom = "";
$.get("http://localhost:3000/debate/debates", function( data ) {
    if(data.length > 0){
        console.log(data);
        daroom = data[0]["room"];
        console.log("room: " + daroom);
        //var socket = io();

        socket.emit("joinDebate", {"room":daroom, "username": "hoodlum2"});
        console.log("sockid: " + socket.id);
    }
});

socket.on("debate starting", function(msg){
    console.log("debate starting");
});

socket.on("joined room debater", function(data){
    console.log("joined debater room");
})

var fakedCreate = {
    "topic":"some topic",
    "political": 0,
    "type": "parli",
    "topicPre":1,
    "sidesPre":1,
    "openPositions": "opposition",
    "serious": 1,
    "username": "createrusername",
}



soundManager.setup({
	url: '.',
	onready: function() {

	},
	ontimeout: function() {
    			// Hrmm, SM2 could not start. Missing SWF? Flash blocked? Show an error, etc.?
    			alert('ontimeout');
    		}
    	});

socket.on("thinking time", function(msg){
    console.log("thinking time");
});

socket.on('your turn to speak', function(msg){
    console.log("recieved turn");
    shouldPlay = false;
    shouldRecord = true;

    recording = true;
    // reset the buffers for the new recording
    leftchannel.length = rightchannel.length = 0;
    recordingLength = 0;
    outputElement.innerHTML = 'Recording now...';
    setTimeout(blobCreateTimerF, 0);
    //setTimeout(blobPlayTimerF, 1000);
    speakerKey = msg.key;
    room = msg.room;
});

socket.on("send sound", function(msg){
    console.log("got sound");

    var ob = JSON.parse(msg);//new Blob ( [blob], { type : 'audio/wav' } );
    lc = JSON.parse(ob["L"]);
    rc = JSON.parse(ob["R"]);
    recordingLength = parseInt(ob["rlen"]);
    leftchannel = [];
    rightchannel = [];
    for(var i = 0; lc[i] != null; i++){
        leftchannel[i] = [];
        rightchannel[i] = [];
        for(var j = 0; lc[i][""+j] != null; j++){
            leftchannel[i][j] = lc[i][""+j];
            rightchannel[i][j] = rc[i][""+j];
        };
    };
    var mySound = soundManager.createSound({
        url: (window.URL || window.webkitURL).createObjectURL(createBlob()),
        onfinish: function(){
            if(sounds.length > 1){
                playBlob();
                console.log(sounds.length);
            } else {
                blobPlayTimerF();
            }
        }
    });

    sounds.push(mySound);
})

socket.on("talking time", function(msg) {
    shouldPlay = false;
    shouldRecord = false;
});

socket.on('sound blob', function(msg){
    var ob = JSON.parse(msg);//new Blob ( [blob], { type : 'audio/wav' } );
    lc = JSON.parse(ob["L"]);
    rc = JSON.parse(ob["R"]);
    recordingLength = parseInt(ob["rlen"]);
    leftchannel = [];
    rightchannel = [];
    for(var i = 0; lc[i] != null; i++){
        leftchannel[i] = [];
        rightchannel[i] = [];
        for(var j = 0; lc[i][""+j] != null; j++){
            leftchannel[i][j] = lc[i][""+j];
            rightchannel[i][j] = rc[i][""+j];
        };
    };
    var mySound = soundManager.createSound({
        url: (window.URL || window.webkitURL).createObjectURL(createBlob()),
        onfinish: function(){
            if(sounds.length > 1){
                playBlob();
                console.log(sounds.length);
            } else {
                blobPlayTimerF();
            }
        }
    });

    sounds.push(mySound);
});

// feature detection 
if (!navigator.getUserMedia)
	navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia || navigator.msGetUserMedia;

if (navigator.getUserMedia){
	navigator.getUserMedia({audio:true}, success, function(e) {
		alert('Error capturing audio.');
	});
} else alert('getUserMedia not supported in this browser.');

function success(e){
    // creates the audio context
    audioContext = window.AudioContext || window.webkitAudioContext;
    context = new audioContext();

    console.log('succcess');
    
    // creates a gain node
    volume = context.createGain();

    // creates an audio node from the microphone incoming stream
    audioInput = context.createMediaStreamSource(e);

    // connect the stream to the gain node
    audioInput.connect(volume);

    /* From the spec: This value controls how frequently the audioprocess event is 
    dispatched and how many sample-frames need to be processed each call. 
    Lower values for buffer size will result in a lower (better) latency. 
    Higher values will be necessary to avoid audio breakup and glitches */
    var bufferSize = 2048;
    recorder = context.createScriptProcessor(bufferSize, 2, 2);

    recorder.onaudioprocess = function(e){
    	if (!recording) return;
    	var left = e.inputBuffer.getChannelData (0);
    	var right = e.inputBuffer.getChannelData (1);
        // we clone the samples
        leftchannel.push (new Float32Array (left));
        rightchannel.push (new Float32Array (right));
        recordingLength += bufferSize;
        //console.log('recording');
    }

    // we connect the recorder
    volume.connect (recorder);
    recorder.connect (context.destination); 
}

function blobCreateTimerF(){
    if(shouldRecord){
        var lc = "";
        for(var i = 0; i< leftchannel.length; i++){
            lc
        }
        var ob = {"L": JSON.stringify(leftchannel), "R": JSON.stringify(rightchannel), "rlen":""+recordingLength}
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;
        //console.log(JSON.stringify(blob));
        var send = {"speakerKey":speakerKey, "sound":JSON.stringify(ob), "room":room};
        socket.emit("send sound", send);
        setTimeout(blobCreateTimerF, 1000);
    }
}


function createBlob(){
    outputElement.innerHTML = 'Building wav file...';

        // we flat the left and right channels down
        var leftBuffer = mergeBuffers ( leftchannel, recordingLength );
        var rightBuffer = mergeBuffers ( rightchannel, recordingLength );
        // we interleave both channels together

        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;

        var interleaved = interleave ( leftBuffer, rightBuffer );
        
        // we create our wav file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);
        
        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');
        view.setUint32(4, 44 + interleaved.length * 2, true);
        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, 2, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 4, true);
        view.setUint16(32, 4, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);
        
        // write the PCM samples
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++){
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }
        
        // our final binary blob
        var blob = new Blob ( [ view ], { type : 'audio/wav' } );
        return blob;
    }

//sas
function interleave(leftChannel, rightChannel){
    var length = leftChannel.length + rightChannel.length;
    var result = new Float32Array(length);

    var inputIndex = 0;

    for (var index = 0; index < length; ){
        result[index++] = leftChannel[inputIndex];
        result[index++] = rightChannel[inputIndex];
        inputIndex++;
    }
    return result;
}
function playBlob(){
    sounds[0].play();
    sounds = sounds.slice(1, soundURLs.length);
    console.log("sounds.length: " + sounds.length);
}
function mergeBuffers(channelBuffer, recordingLength){
    var result = new Float32Array(recordingLength);
    var offset = 0;
    var lng = channelBuffer.length;
    for (var i = 0; i < lng; i++){
        var buffer = channelBuffer[i];
        result.set(buffer, offset);
        offset += buffer.length;
    }
    return result;
}

function writeUTFBytes(view, offset, string){ 
    var lng = string.length;
    for (var i = 0; i < lng; i++){
        view.setUint8(offset + i, string.charCodeAt(i));
    }
}
function blobPlayTimerF(){
    if(shouldPlay){
        if(sounds.length > 0){
            playBlob();
        } else{
            console.log('delayed')
            setTimeout(blobPlayTimerF, 10);
        }
    }
}