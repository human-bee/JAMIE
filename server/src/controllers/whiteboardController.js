const { Whiteboard, Session } = require('../models');
const logger = require('../utils/logger');

/**
 * Create a new whiteboard for a session
 */
exports.createWhiteboard = async (req, res) => {
  try {
    const { sessionId } = req.body;

    // Verify session exists
    const session = await Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }

    // Create whiteboard
    const whiteboard = await Whiteboard.create({
      sessionId,
      pages: [{ pageNumber: 1 }]
    });

    res.status(201).json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    logger.error('Error creating whiteboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create whiteboard'
    });
  }
};

/**
 * Get whiteboard state
 */
exports.getWhiteboard = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { version } = req.query;

    let whiteboard;
    if (version) {
      whiteboard = await Whiteboard.getVersion(sessionId, parseInt(version));
    } else {
      whiteboard = await Whiteboard.findBySession(sessionId);
    }

    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: 'Whiteboard not found'
      });
    }

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    logger.error('Error getting whiteboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get whiteboard'
    });
  }
};

/**
 * Add element to whiteboard
 */
exports.addElement = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pageNumber, element } = req.body;

    const whiteboard = await Whiteboard.findBySession(sessionId);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: 'Whiteboard not found'
      });
    }

    await whiteboard.addElement(pageNumber, {
      ...element,
      metadata: {
        ...element.metadata,
        createdBy: req.body.userId,
        createdAt: new Date()
      }
    });

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    logger.error('Error adding element:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add element'
    });
  }
};

/**
 * Update element
 */
exports.updateElement = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pageNumber, elementId, updates } = req.body;

    const whiteboard = await Whiteboard.findBySession(sessionId);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: 'Whiteboard not found'
      });
    }

    await whiteboard.updateElement(pageNumber, elementId, {
      ...updates,
      metadata: {
        ...updates.metadata,
        lastModifiedBy: req.body.userId,
        lastModifiedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    logger.error('Error updating element:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update element'
    });
  }
};

/**
 * Remove element
 */
exports.removeElement = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { pageNumber, elementId } = req.body;

    const whiteboard = await Whiteboard.findBySession(sessionId);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: 'Whiteboard not found'
      });
    }

    await whiteboard.removeElement(pageNumber, elementId);

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    logger.error('Error removing element:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove element'
    });
  }
};

/**
 * Add new page
 */
exports.addPage = async (req, res) => {
  try {
    const { sessionId } = req.params;

    const whiteboard = await Whiteboard.findBySession(sessionId);
    if (!whiteboard) {
      return res.status(404).json({
        success: false,
        error: 'Whiteboard not found'
      });
    }

    await whiteboard.addPage();

    res.json({
      success: true,
      data: whiteboard
    });
  } catch (error) {
    logger.error('Error adding page:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add page'
    });
  }
}; 