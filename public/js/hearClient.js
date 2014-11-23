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
var soundURLs = [];
var sounds = [];

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
        blobs = [];
        shouldPlay = true;
        setTimeout(blobPlayTimerF, 1000);
    } else if ( e.keyCode == 83 ){
        shouldPlay = false;
    }
}
function playBlob(){
    sounds[0].play();
    sounds = sounds.slice(1, soundURLs.length);
    console.log("sounds.length: " + sounds.length);
}

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
            if(sounds.length >= 0){
                playBlob();
                console.log(sounds.length);
            } else {
                blobPlayTimerF();
            }
        }
    });
    sounds.push(mySound);
    console.log('pushed');
});

function blobPlayTimerF(){
    if(shouldPlay){
        if(sounds.length > 0){
            playBlob();
        } else{
            console.log('delayed')
            setTimeout(blobPlayTimerF, 200);
        }
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