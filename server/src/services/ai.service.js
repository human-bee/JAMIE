import { Configuration, OpenAIApi } from 'openai';
import livekitService from './livekit.service.js';

class AIService {
  constructor() {
    this.openai = new OpenAIApi(new Configuration({
      apiKey: process.env.OPENAI_API_KEY
    }));
    
    this.conversationHistory = [];
    this.currentContext = {
      transcription: '',
      files: [],
      participants: []
    };
  }

  /**
   * Update the AI's context with new information
   */
  updateContext(updates) {
    this.currentContext = {
      ...this.currentContext,
      ...updates
    };
  }

  /**
   * Add a message to the conversation history
   */
  addToHistory(message) {
    this.conversationHistory.push(message);
    // Keep only last 50 messages for context
    if (this.conversationHistory.length > 50) {
      this.conversationHistory.shift();
    }
  }

  /**
   * Generate a response based on the current context and history
   */
  async generateResponse(trigger = 'chat') {
    try {
      // Create the system message with current context
      const systemMessage = {
        role: 'system',
        content: `You are JAMIE (Joint AI Multimedia Interaction Engine), an AI assistant participating in a group conversation.
Current Context:
- Participants: ${this.currentContext.participants.join(', ')}
- Recent transcription: ${this.currentContext.transcription}
- Files discussed: ${this.currentContext.files.map(f => f.name).join(', ')}

Your role is to:
1. Provide relevant insights and fact-checking
2. Answer questions about shared content
3. Suggest visualizations or analysis when appropriate
4. Maintain a helpful but natural conversational tone
5. Keep responses concise and focused

Respond in a way that's natural for the conversation flow.`
      };

      // Prepare conversation history
      const messages = [
        systemMessage,
        ...this.conversationHistory.map(msg => ({
          role: msg.isAI ? 'assistant' : 'user',
          content: `${msg.sender}: ${msg.content}`
        }))
      ];

      // Add specific trigger context if needed
      if (trigger === 'transcription_update') {
        messages.push({
          role: 'system',
          content: 'A new part of the conversation has been transcribed. If you notice any factual claims or interesting points that warrant comment, respond. Otherwise, stay quiet.'
        });
      }

      const response = await this.openai.createChatCompletion({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 150,
        presence_penalty: 0.6
      });

      const aiResponse = response.data.choices[0].message.content;
      
      // Only respond if the AI has something meaningful to say
      if (aiResponse.trim() && !aiResponse.toLowerCase().includes('no response needed')) {
        return {
          content: aiResponse,
          type: 'chat',
          shouldSpeak: trigger === 'transcription_update' // Use text-to-speech for transcription-triggered responses
        };
      }

      return null;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return null;
    }
  }

  /**
   * Process a transcription update and decide whether to respond
   */
  async handleTranscriptionUpdate(newTranscription) {
    this.updateContext({
      transcription: newTranscription
    });

    // Add transcription to history as a special type
    this.addToHistory({
      content: newTranscription,
      type: 'transcription',
      timestamp: new Date()
    });

    return this.generateResponse('transcription_update');
  }

  /**
   * Process a chat message and generate a response if appropriate
   */
  async handleChatMessage(message) {
    this.addToHistory(message);

    // Check if the message warrants a response
    const shouldRespond = 
      message.content.includes('JAMIE') ||
      message.content.includes('?') ||
      message.content.toLowerCase().includes('what') ||
      message.content.toLowerCase().includes('how') ||
      message.content.toLowerCase().includes('why');

    if (shouldRespond) {
      return this.generateResponse('chat');
    }

    return null;
  }

  /**
   * Process a new file and generate insights
   */
  async handleNewFile(file) {
    this.updateContext({
      files: [...this.currentContext.files, file]
    });

    // Generate insights based on file type and content
    const systemMessage = {
      role: 'system',
      content: `Analyze this ${file.type} file and provide brief, interesting insights that would be relevant to the conversation.
If there are any visualizations that might be helpful, suggest them.`
    };

    const fileContent = file.content.text || file.content.summary || JSON.stringify(file.content);
    
    const response = await this.openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        systemMessage,
        { role: 'user', content: fileContent }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return {
      content: response.data.choices[0].message.content,
      type: 'file_insight',
      shouldSpeak: true
    };
  }

  /**
   * Update participant list and generate appropriate responses
   */
  async handleParticipantUpdate(participants) {
    const prevParticipants = this.currentContext.participants;
    this.updateContext({ participants });

    // Generate welcome messages for new participants
    const newParticipants = participants.filter(p => !prevParticipants.includes(p));
    if (newParticipants.length > 0) {
      return {
        content: `Welcome ${newParticipants.join(', ')}! I'm JAMIE, your AI assistant. I'll help with fact-checking, analysis, and answering questions. Feel free to ask me anything!`,
        type: 'welcome',
        shouldSpeak: false
      };
    }

    return null;
  }
}

// Create and export a singleton instance
const aiService = new AIService();
export default aiService; 