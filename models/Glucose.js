const mongoose = require('mongoose');

const glucoseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  niveau: {
    type: Number,
    required: [true, 'Le niveau de glucose est requis'],
    min: [20, 'Le niveau doit être supérieur à 20'],
    max: [600, 'Le niveau doit être inférieur à 600']
  },
  remarque: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now,
    index: true
  },
  moment: {
    type: String,
    enum: ['Matin', 'Midi', 'Soir', 'Nuit'],
    default: 'Matin'
  }
}, {
  timestamps: true
});

// Index composé pour optimiser les requêtes par utilisateur et date
glucoseSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Glucose', glucoseSchema);
