import aiService from '../services/ai.service.js';
import ttsService from '../services/tts.service.js';
import livekitService from '../services/livekit.service.js';

export const handleChatMessage = async (req, res) => {
  try {
    const message = req.body;
    const response = await aiService.handleChatMessage(message);

    if (response) {
      // Send the AI's response to all participants via LiveKit
      const aiDetails = livekitService.addAIToRoom(message.roomName);
      const aiMessage = {
        type: 'chat',
        content: response.content
      };

      // Publish the message to all participants
      await livekitService.publishData(
        aiDetails.token,
        JSON.stringify(aiMessage)
      );

      res.json(response);
    } else {
      res.json({ content: null });
    }
  } catch (error) {
    console.error('Error handling chat message:', error);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
};

export const handleTranscriptionUpdate = async (req, res) => {
  try {
    const { transcription, roomName } = req.body;
    const response = await aiService.handleTranscriptionUpdate(transcription);

    if (response && response.shouldSpeak) {
      // Generate speech for the response
      const audioStream = await ttsService.generateSpeech(response);

      // Send the audio to all participants
      const aiDetails = livekitService.addAIToRoom(roomName);
      await livekitService.publishAudio(aiDetails.token, audioStream);

      // Also send as a chat message
      const aiMessage = {
        type: 'chat',
        content: response.content
      };

      await livekitService.publishData(
        aiDetails.token,
        JSON.stringify(aiMessage)
      );
    }

    res.json(response || { content: null });
  } catch (error) {
    console.error('Error handling transcription update:', error);
    res.status(500).json({
      error: 'Failed to process transcription',
      details: error.message
    });
  }
};

export const handleTextToSpeech = async (req, res) => {
  try {
    const { text } = req.query;
    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const audioStream = await ttsService.textToSpeech(text);
    
    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');

    // Pipe the audio stream to the response
    audioStream.pipe(res);
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({
      error: 'Failed to generate speech',
      details: error.message
    });
  }
};

export const handleFileInsight = async (req, res) => {
  try {
    const { file, roomName } = req.body;
    const response = await aiService.handleNewFile(file);

    if (response) {
      // Generate speech if needed
      if (response.shouldSpeak) {
        const audioStream = await ttsService.generateSpeech(response);
        const aiDetails = livekitService.addAIToRoom(roomName);
        await livekitService.publishAudio(aiDetails.token, audioStream);
      }

      // Send as chat message
      const aiMessage = {
        type: 'chat',
        content: response.content
      };

      const aiDetails = livekitService.addAIToRoom(roomName);
      await livekitService.publishData(
        aiDetails.token,
        JSON.stringify(aiMessage)
      );

      res.json(response);
    } else {
      res.json({ content: null });
    }
  } catch (error) {
    console.error('Error generating file insight:', error);
    res.status(500).json({
      error: 'Failed to analyze file',
      details: error.message
    });
  }
}; 