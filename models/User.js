const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  sexe: {
    type: String,
    enum: ['Homme', 'Femme'],
    required: [true, 'Le sexe est requis']
  },
  poids: {
    type: Number,
    required: [true, 'Le poids est requis'],
    min: [20, 'Le poids doit être supérieur à 20kg']
  },
  taille: {
    type: Number,
    required: [true, 'La taille est requise'],
    min: [100, 'La taille doit être supérieure à 100cm']
  },
  telephone: {
    type: String,
    required: [true, 'Le téléphone est requis'],
    unique: true,
    trim: true
  },
  typeDiabete: {
    type: String,
    enum: ['Type 1', 'Type 2', 'Gestationnel'],
    required: [true, 'Le type de diabète est requis']
  },
  motDePasse: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
  },
  dateCreation: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Ne pas retourner le mot de passe dans les réponses JSON
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.motDePasse;
  return user;
};

module.exports = mongoose.model('User', userSchema);
