const mongoose = require('mongoose');

const glucoseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  level: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  timeOfDay: {
    type: String,
    required: true,
    enum: ['Matin', 'Midi', 'Soir', 'Nuit', 'Autre']
  },
  remark: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Glucose', glucoseSchema);
