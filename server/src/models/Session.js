const mongoose = require('mongoose');

const participantSchema = new mongoose.Schema({
  identity: {
    type: String,
    required: true
  },
  name: String,
  joinedAt: {
    type: Date,
    default: Date.now
  },
  leftAt: Date,
  role: {
    type: String,
    enum: ['host', 'guest', 'ai'],
    default: 'guest'
  }
});

const sessionSchema = new mongoose.Schema({
  roomName: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  status: {
    type: String,
    enum: ['created', 'active', 'ended'],
    default: 'created'
  },
  participants: [participantSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  endedAt: Date,
  settings: {
    recordingEnabled: {
      type: Boolean,
      default: true
    },
    aiInterjectionsEnabled: {
      type: Boolean,
      default: true
    },
    transcriptionEnabled: {
      type: Boolean,
      default: true
    }
  },
  metadata: {
    title: String,
    description: String,
    tags: [String]
  }
}, {
  timestamps: true
});

// Indexes
sessionSchema.index({ createdAt: -1 });
sessionSchema.index({ status: 1 });

// Methods
sessionSchema.methods.addParticipant = function(participantData) {
  this.participants.push(participantData);
  return this.save();
};

sessionSchema.methods.removeParticipant = function(identity) {
  const participant = this.participants.find(p => p.identity === identity && !p.leftAt);
  if (participant) {
    participant.leftAt = new Date();
  }
  return this.save();
};

sessionSchema.methods.endSession = function() {
  this.status = 'ended';
  this.endedAt = new Date();
  return this.save();
};

// Statics
sessionSchema.statics.findActive = function() {
  return this.find({ status: 'active' });
};

sessionSchema.statics.findByParticipant = function(identity) {
  return this.find({
    'participants.identity': identity,
    status: { $ne: 'ended' }
  });
};

const Session = mongoose.model('Session', sessionSchema);

module.exports = Session; 