const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  sex: {
    type: String,
    enum: ['Homme', 'Femme'],
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  mobileNumber: {
    type: String,
    required: true,
    unique: true
  },
  diabetesType: {
    type: String,
    enum: ['Type 1', 'Type 2', 'Gestationnel'],
    required: true
  },
  password: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
