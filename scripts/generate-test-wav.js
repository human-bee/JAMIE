const fs = require('fs');
const { WaveFile } = require('wavefile');

// Create a WAV file with a simple sine wave
const sampleRate = 16000;
const duration = 1; // seconds
const frequency = 440; // Hz

// Generate samples
const samples = new Float32Array(sampleRate * duration);
for (let i = 0; i < samples.length; i++) {
  samples[i] = Math.sin(2 * Math.PI * frequency * i / sampleRate);
}

// Create WAV file
const wav = new WaveFile();
wav.fromScratch(1, sampleRate, '32f', samples);

// Write to file
fs.writeFileSync('test.wav', wav.toBuffer()); 