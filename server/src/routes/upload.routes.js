import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileTypeFromBuffer } from 'file-type';
import { processUploadedFile } from '../services/fileProcessing.service.js';

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage(); // Store files in memory for processing
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'text/plain',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  }
});

// Handle file uploads
router.post('/', upload.array('files'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const processedFiles = await Promise.all(
      req.files.map(async (file) => {
        // Verify file type
        const fileTypeResult = await fileTypeFromBuffer(file.buffer);
        if (!fileTypeResult) {
          throw new Error(`Could not determine type for file: ${file.originalname}`);
        }

        // Process the file based on its type
        const result = await processUploadedFile(file);
        
        return {
          originalName: file.originalname,
          type: fileTypeResult.mime,
          size: file.size,
          content: result
        };
      })
    );

    res.json({
      message: 'Files processed successfully',
      files: processedFiles
    });
  } catch (error) {
    console.error('Error processing files:', error);
    res.status(500).json({
      error: 'Error processing files',
      details: error.message
    });
  }
});

export default router; 