import pdf from 'pdf-parse';
import csv from 'csv-parse/sync';
import { createWorker } from 'tesseract.js';
import { Configuration, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Initialize Tesseract worker for OCR
let tesseractWorker = null;

async function getOCRWorker() {
  if (!tesseractWorker) {
    tesseractWorker = await createWorker();
    await tesseractWorker.loadLanguage('eng');
    await tesseractWorker.initialize('eng');
  }
  return tesseractWorker;
}

export async function processUploadedFile(file) {
  const type = file.mimetype.toLowerCase();

  try {
    if (type.includes('pdf')) {
      return await processPDF(file.buffer);
    } else if (type.includes('csv')) {
      return await processCSV(file.buffer);
    } else if (type.includes('image')) {
      return await processImage(file.buffer);
    } else if (type.includes('text')) {
      return await processText(file.buffer);
    } else {
      throw new Error('Unsupported file type');
    }
  } catch (error) {
    console.error(`Error processing file: ${file.originalname}`, error);
    throw error;
  }
}

async function processPDF(buffer) {
  const data = await pdf(buffer);
  const content = data.text;
  
  // Get AI summary of the PDF content
  const summary = await getAISummary(content);
  
  return {
    text: content,
    summary,
    pageCount: data.numpages
  };
}

async function processCSV(buffer) {
  const content = buffer.toString('utf-8');
  const records = csv.parse(content, {
    columns: true,
    skip_empty_lines: true
  });

  // Basic statistics about the CSV
  const columnNames = Object.keys(records[0] || {});
  const rowCount = records.length;
  
  // Get AI insights about the data
  const insights = await getAIInsights(records);

  return {
    records,
    metadata: {
      columns: columnNames,
      rowCount
    },
    insights
  };
}

async function processImage(buffer) {
  // Perform OCR on the image
  const worker = await getOCRWorker();
  const { data: { text } } = await worker.recognize(buffer);
  
  // Get AI description of the image
  const description = await getImageDescription(buffer);

  return {
    ocr: text,
    description
  };
}

async function processText(buffer) {
  const content = buffer.toString('utf-8');
  
  // Get AI summary and key points
  const analysis = await getAISummary(content);
  
  return {
    text: content,
    analysis
  };
}

async function getAISummary(text) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a helpful assistant that provides concise summaries and key points from text."
      }, {
        role: "user",
        content: `Please provide a brief summary and key points from the following text: ${text.substring(0, 3000)}...`
      }]
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI summary:', error);
    return 'Error generating summary';
  }
}

async function getAIInsights(data) {
  try {
    const sample = JSON.stringify(data.slice(0, 10));
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{
        role: "system",
        content: "You are a data analyst providing insights about CSV data."
      }, {
        role: "user",
        content: `Analyze this CSV data sample and provide key insights (patterns, anomalies, suggestions): ${sample}`
      }]
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting AI insights:', error);
    return 'Error generating insights';
  }
}

async function getImageDescription(buffer) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-4-vision-preview",
      messages: [{
        role: "system",
        content: "You are a helpful assistant that describes images in detail."
      }, {
        role: "user",
        content: [{
          type: "image_url",
          image_url: {
            url: `data:image/jpeg;base64,${buffer.toString('base64')}`
          }
        }, {
          type: "text",
          text: "Please describe this image in detail."
        }]
      }]
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error getting image description:', error);
    return 'Error generating image description';
  }
} 