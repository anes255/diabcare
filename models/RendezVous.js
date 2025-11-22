const mongoose = require('mongoose');

const rendezVousSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: [true, 'La date du rendez-vous est requise'],
    index: true
  },
  notes: {
    type: String,
    trim: true
  },
  rappelsGeneres: [{
    type: Date
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
rendezVousSchema.index({ userId: 1, actif: 1 });

// Méthode pour générer les rappels tous les 3 mois pendant 3 ans
rendezVousSchema.methods.genererRappels = function() {
  const rappels = [];
  const dateInitiale = new Date(this.date);
  
  for (let i = 1; i <= 12; i++) {
    const rappel = new Date(dateInitiale);
    rappel.setMonth(rappel.getMonth() + (i * 3));
    rappels.push(rappel);
  }
  
  this.rappelsGeneres = rappels;
  return rappels;
};

module.exports = mongoose.model('RendezVous', rendezVousSchema);
