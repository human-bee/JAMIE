const fs = require('fs');
const path = require('path');

// Read the WAV file
const audioFile = process.argv[2];
const timestamp = parseInt(process.argv[3] || '0');

if (!audioFile) {
  console.error('Please provide a WAV file path');
  process.exit(1);
}

const audioData = fs.readFileSync(audioFile);
const base64Audio = audioData.toString('base64');

// Create the JSON payload
const payload = {
  audioData: base64Audio,
  timestamp
};

// Write to a JSON file
const outputFile = path.join(
  path.dirname(audioFile),
  path.basename(audioFile, '.wav') + '.json'
);

fs.writeFileSync(outputFile, JSON.stringify(payload));
console.log(`Created ${outputFile}`); 