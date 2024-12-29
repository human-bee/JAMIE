const mongoose = require('mongoose');

const utteranceSchema = new mongoose.Schema({
  speaker: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  analysis: {
    sentiment: {
      score: Number,
      label: String
    },
    topics: [String],
    entities: [{
      text: String,
      type: String,
      confidence: Number
    }],
    factChecks: [{
      claim: String,
      verdict: {
        type: String,
        enum: ['true', 'false', 'partially_true', 'unverified']
      },
      confidence: Number,
      source: String,
      explanation: String
    }]
  }
});

const transcriptSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  status: {
    type: String,
    enum: ['in_progress', 'completed', 'error'],
    default: 'in_progress'
  },
  utterances: [utteranceSchema],
  summary: {
    shortVersion: String,
    longVersion: String,
    keyPoints: [String],
    actionItems: [String],
    topics: [String]
  },
  metadata: {
    language: {
      type: String,
      default: 'en'
    },
    audioQuality: {
      type: String,
      enum: ['low', 'medium', 'high']
    },
    transcriptionModel: String,
    processingStats: {
      totalDuration: Number,
      speakerCount: Number,
      wordCount: Number,
      averageConfidence: Number
    }
  }
}, {
  timestamps: true
});

// Indexes
transcriptSchema.index({ sessionId: 1 });
transcriptSchema.index({ 'utterances.startTime': 1 });
transcriptSchema.index({ 'utterances.speaker': 1 });
transcriptSchema.index({ status: 1 });

// Methods
transcriptSchema.methods.addUtterance = function(utteranceData) {
  this.utterances.push(utteranceData);
  return this.save();
};

transcriptSchema.methods.updateSummary = function(summaryData) {
  this.summary = { ...this.summary, ...summaryData };
  return this.save();
};

transcriptSchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

// Statics
transcriptSchema.statics.findBySession = function(sessionId) {
  return this.findOne({ sessionId });
};

transcriptSchema.statics.findByTimeRange = function(sessionId, startTime, endTime) {
  return this.findOne({
    sessionId,
    'utterances.startTime': { $gte: startTime },
    'utterances.endTime': { $lte: endTime }
  });
};

transcriptSchema.statics.findBySpeaker = function(sessionId, speaker) {
  return this.findOne({
    sessionId,
    'utterances.speaker': speaker
  });
};

const Transcript = mongoose.model('Transcript', transcriptSchema);

module.exports = Transcript; 