import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import { Readable } from 'stream';

class TTSService {
  constructor() {
    this.client = new TextToSpeechClient({
      credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS || '{}')
    });
  }

  /**
   * Convert text to speech and return an audio stream
   * @param {string} text - The text to convert to speech
   * @returns {Promise<Readable>} A readable stream of the audio
   */
  async textToSpeech(text) {
    try {
      // Configure the voice to sound natural and engaging
      const request = {
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: 'en-US-Neural2-F', // Female voice that sounds natural
          ssmlGender: 'FEMALE'
        },
        audioConfig: {
          audioEncoding: 'MP3',
          pitch: 0,
          speakingRate: 1.1, // Slightly faster than normal
          effectsProfileId: ['small-bluetooth-speaker-class-device']
        }
      };

      const [response] = await this.client.synthesizeSpeech(request);
      
      // Convert the audio buffer to a stream
      const audioStream = new Readable();
      audioStream.push(response.audioContent);
      audioStream.push(null);

      return audioStream;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw error;
    }
  }

  /**
   * Process text for better speech synthesis
   * @param {string} text - The text to process
   * @returns {string} Processed text with SSML markup
   */
  processTextForSpeech(text) {
    // Add SSML markup for better speech synthesis
    let ssml = '<speak>';
    
    // Add pauses after punctuation
    ssml += text
      .replace(/\./g, '.<break time="500ms"/>')
      .replace(/,/g, ',<break time="200ms"/>')
      .replace(/\?/g, '?<break time="500ms"/>')
      .replace(/!/g, '!<break time="500ms"/>');

    // Emphasize key terms or important parts
    ssml = ssml
      .replace(/\*([^*]+)\*/g, '<emphasis>$1</emphasis>')
      .replace(/_([^_]+)_/g, '<prosody rate="slow">$1</prosody>');

    ssml += '</speak>';
    return ssml;
  }

  /**
   * Generate speech for different types of responses
   * @param {Object} response - The AI response object
   * @returns {Promise<Readable>} A readable stream of the audio
   */
  async generateSpeech(response) {
    let text = response.content;

    // Adjust text based on response type
    switch (response.type) {
      case 'welcome':
        text = this.processTextForSpeech(
          `<prosody rate="medium" pitch="+1st">${text}</prosody>`
        );
        break;

      case 'file_insight':
        text = this.processTextForSpeech(
          `<prosody rate="medium">I noticed something interesting: ${text}</prosody>`
        );
        break;

      case 'transcription_update':
        text = this.processTextForSpeech(
          `<prosody rate="medium">Just to add: ${text}</prosody>`
        );
        break;

      default:
        text = this.processTextForSpeech(text);
    }

    return this.textToSpeech(text);
  }
}

// Create and export a singleton instance
const ttsService = new TTSService();
export default ttsService; 