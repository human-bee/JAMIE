require('dotenv').config();
const { OpenAI } = require('openai');
const { RoomServiceClient } = require('livekit-server-sdk');
const mongoose = require('mongoose');
const logger = require('./logger');

async function testOpenAI() {
  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: "Hello, this is a test message." }]
    });
    
    logger.info('✅ OpenAI API connection successful');
    return true;
  } catch (error) {
    logger.error('❌ OpenAI API connection failed:', error.message);
    return false;
  }
}

async function testLiveKit() {
  try {
    const roomService = new RoomServiceClient(
      process.env.LIVEKIT_WS_URL,
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
    
    // Try to list rooms
    const rooms = await roomService.listRooms();
    logger.info('✅ LiveKit API connection successful');
    return true;
  } catch (error) {
    logger.error('❌ LiveKit API connection failed:', error.message);
    return false;
  }
}

async function testMongoDB() {
  try {
    logger.info(`Attempting to connect to MongoDB at: ${process.env.MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Giving it a bit more time
      socketTimeoutMS: 10000
    });
    
    logger.info('✅ MongoDB connection successful');
    await mongoose.disconnect();
    return true;
  } catch (error) {
    logger.error('❌ MongoDB connection failed. Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      codeName: error.codeName
    });
    return false;
  }
}

async function runTests() {
  logger.info('Starting API connection tests...\n');
  
  const results = await Promise.all([
    testOpenAI(),
    testLiveKit(),
    testMongoDB()
  ]);
  
  const allPassed = results.every(result => result === true);
  
  logger.info('\nTest Results Summary:');
  logger.info(`OpenAI API: ${results[0] ? '✅' : '❌'}`);
  logger.info(`LiveKit API: ${results[1] ? '✅' : '❌'}`);
  logger.info(`MongoDB: ${results[2] ? '✅' : '❌'}`);
  logger.info(`\nOverall Status: ${allPassed ? '✅ All tests passed' : '❌ Some tests failed'}`);
  
  process.exit(allPassed ? 0 : 1);
}

runTests(); 