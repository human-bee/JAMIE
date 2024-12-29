const express = require('express');
const router = express.Router();
const whiteboardController = require('../controllers/whiteboardController');

// Create new whiteboard
router.post('/', whiteboardController.createWhiteboard);

// Get whiteboard state
router.get('/:sessionId', whiteboardController.getWhiteboard);

// Add element to whiteboard
router.post('/:sessionId/elements', whiteboardController.addElement);

// Update element
router.put('/:sessionId/elements', whiteboardController.updateElement);

// Remove element
router.delete('/:sessionId/elements', whiteboardController.removeElement);

// Add new page
router.post('/:sessionId/pages', whiteboardController.addPage);

module.exports = router; 