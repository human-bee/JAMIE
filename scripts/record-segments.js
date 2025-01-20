const Microphone = require('node-microphone');
const fs = require('fs');
const { WaveFile } = require('wavefile');

const mic = new Microphone({
  rate: '16000',
  channels: '1',
  bitwidth: '16'
});

let currentSegment = 1;
const totalSegments = 3;
const segmentDuration = 5000; // 5 seconds

console.log('Recording will start in 3 seconds...');
setTimeout(() => {
  console.log('Recording started! Speak into your microphone.');
  recordSegment();
}, 3000);

function recordSegment() {
  if (currentSegment > totalSegments) {
    console.log('Recording complete! Check the audio files in the temp directory.');
    return;
  }

  console.log(`Recording segment ${currentSegment} of ${totalSegments}...`);
  
  const audioChunks = [];
  const micStream = mic.startRecording();
  
  micStream.on('data', (data) => {
    audioChunks.push(data);
  });

  setTimeout(() => {
    mic.stopRecording();
    const audioBuffer = Buffer.concat(audioChunks);
    
    // Create WAV file
    const wav = new WaveFile();
    
    // Create a mono 16-bit WAV at 16kHz
    wav.fromScratch(1, 16000, '16', audioBuffer);
    
    // Ensure temp directory exists
    if (!fs.existsSync('temp')) {
      fs.mkdirSync('temp');
    }
    
    // Save the file
    const timestamp = Date.now();
    const filePath = `temp/segment_${currentSegment}_${timestamp}.wav`;
    fs.writeFileSync(filePath, wav.toBuffer());
    
    console.log(`Segment ${currentSegment} saved to ${filePath}`);
    
    currentSegment++;
    if (currentSegment <= totalSegments) {
      console.log('\nStarting next segment in 2 seconds...');
      setTimeout(recordSegment, 2000);
    } else {
      console.log('\nAll segments recorded successfully!');
      process.exit(0);
    }
  }, segmentDuration);
} 