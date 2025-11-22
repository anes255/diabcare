const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  nom: {
    type: String,
    required: [true, 'Le nom du médicament est requis'],
    trim: true
  },
  dosage: {
    type: String,
    trim: true
  },
  heures: [{
    type: String,
    required: true
  }],
  actif: {
    type: Boolean,
    default: true,
    index: true
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index composé pour optimiser les requêtes par utilisateur et statut actif
medicationSchema.index({ userId: 1, actif: 1 });

module.exports = mongoose.model('Medication', medicationSchema);
