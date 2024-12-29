const mongoose = require('mongoose');

const elementSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['text', 'image', 'chart', 'shape', 'file', 'ai-generated'],
    required: true
  },
  content: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  position: {
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    rotation: {
      type: Number,
      default: 0
    }
  },
  style: {
    color: String,
    backgroundColor: String,
    fontSize: Number,
    fontFamily: String,
    opacity: Number,
    borderColor: String,
    borderWidth: Number
  },
  metadata: {
    createdBy: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    lastModifiedBy: String,
    lastModifiedAt: Date,
    sourceType: String,
    sourceUrl: String
  },
  version: {
    type: Number,
    default: 1
  }
});

const pageSchema = new mongoose.Schema({
  pageNumber: {
    type: Number,
    required: true
  },
  elements: [elementSchema],
  background: {
    type: String,
    default: 'white'
  },
  thumbnail: String
});

const whiteboardSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  pages: [pageSchema],
  currentPage: {
    type: Number,
    default: 1
  },
  version: {
    type: Number,
    default: 1
  },
  settings: {
    gridEnabled: {
      type: Boolean,
      default: false
    },
    snapToGrid: {
      type: Boolean,
      default: false
    },
    gridSize: {
      type: Number,
      default: 20
    },
    theme: {
      type: String,
      default: 'light'
    }
  }
}, {
  timestamps: true
});

// Indexes
whiteboardSchema.index({ sessionId: 1 });
whiteboardSchema.index({ 'pages.elements.type': 1 });
whiteboardSchema.index({ version: 1 });

// Methods
whiteboardSchema.methods.addElement = function(pageNumber, element) {
  const page = this.pages.find(p => p.pageNumber === pageNumber);
  if (page) {
    page.elements.push(element);
    this.version += 1;
    return this.save();
  }
  throw new Error('Page not found');
};

whiteboardSchema.methods.updateElement = function(pageNumber, elementId, updates) {
  const page = this.pages.find(p => p.pageNumber === pageNumber);
  if (page) {
    const element = page.elements.id(elementId);
    if (element) {
      Object.assign(element, updates);
      element.version += 1;
      this.version += 1;
      return this.save();
    }
    throw new Error('Element not found');
  }
  throw new Error('Page not found');
};

whiteboardSchema.methods.removeElement = function(pageNumber, elementId) {
  const page = this.pages.find(p => p.pageNumber === pageNumber);
  if (page) {
    page.elements.pull(elementId);
    this.version += 1;
    return this.save();
  }
  throw new Error('Page not found');
};

whiteboardSchema.methods.addPage = function() {
  const nextPageNumber = this.pages.length + 1;
  this.pages.push({ pageNumber: nextPageNumber });
  return this.save();
};

// Statics
whiteboardSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId });
};

whiteboardSchema.statics.getVersion = function(sessionId, version) {
  return this.findOne({ 
    sessionId,
    version: { $lte: version }
  }).sort({ version: -1 });
};

const Whiteboard = mongoose.model('Whiteboard', whiteboardSchema);

module.exports = Whiteboard; 