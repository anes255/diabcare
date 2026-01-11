const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Le nom du médicament est requis'],
    trim: true
  },
  dosage: {
    type: String,
    required: [true, 'Le dosage est requis'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'La fréquence est requise'],
    enum: ['Une fois par jour', 'Deux fois par jour', 'Trois fois par jour', 'Quatre fois par jour', 'Autre'],
    default: 'Une fois par jour'
  },
  times: [{
    type: String,
    required: true
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null
  },
  notes: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  notificationIds: [{
    type: String
  }]
}, {
  timestamps: true
});

// Index for faster queries
medicationSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Medication', medicationSchema);
