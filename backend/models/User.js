const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true
  },
  sex: {
    type: String,
    required: [true, 'Le sexe est requis'],
    enum: ['Homme', 'Femme', 'Autre']
  },
  weight: {
    type: Number,
    required: [true, 'Le poids est requis'],
    min: 0
  },
  height: {
    type: Number,
    required: [true, 'La taille est requise'],
    min: 0
  },
  mobileNumber: {
    type: String,
    required: [true, 'Le numéro de téléphone est requis'],
    unique: true,
    trim: true
  },
  diabetesType: {
    type: String,
    required: [true, 'Le type de diabète est requis'],
    enum: ['Type 1', 'Type 2', 'Gestationnel', 'Autre']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: 6
  },
  expoPushToken: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
