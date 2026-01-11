const mongoose = require('mongoose');

const glucoseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  level: {
    type: Number,
    required: [true, 'Le niveau de glucose est requis'],
    min: 0
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  time: {
    type: String,
    required: true
  },
  mealTiming: {
    type: String,
    enum: ['À jeun', 'Avant repas', 'Après repas', 'Avant coucher', 'Autre'],
    default: 'Autre'
  },
  remark: {
    type: String,
    required: true
  },
  remarkType: {
    type: String,
    enum: ['excellent', 'bon', 'moyen', 'eleve', 'tres_eleve'],
    required: true
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Index for faster queries
glucoseSchema.index({ userId: 1, date: -1 });

// Static method to calculate remark based on glucose level
glucoseSchema.statics.calculateRemark = function(level, mealTiming) {
  let remark, remarkType;
  
  if (mealTiming === 'À jeun') {
    if (level < 0.7) {
      remark = '⚠️ Hypoglycémie - Niveau trop bas';
      remarkType = 'tres_eleve';
    } else if (level >= 0.7 && level <= 1.0) {
      remark = '✅ Excellent - Niveau idéal à jeun';
      remarkType = 'excellent';
    } else if (level > 1.0 && level <= 1.26) {
      remark = '👍 Bon - Niveau acceptable à jeun';
      remarkType = 'bon';
    } else if (level > 1.26 && level <= 1.40) {
      remark = '⚠️ Élevé - Attention à surveiller';
      remarkType = 'eleve';
    } else {
      remark = '🚨 Très élevé - Consultez votre médecin';
      remarkType = 'tres_eleve';
    }
  } else if (mealTiming === 'Après repas') {
    if (level < 0.7) {
      remark = '⚠️ Hypoglycémie - Niveau trop bas';
      remarkType = 'tres_eleve';
    } else if (level >= 0.7 && level <= 1.40) {
      remark = '✅ Excellent - Niveau idéal après repas';
      remarkType = 'excellent';
    } else if (level > 1.40 && level <= 1.80) {
      remark = '👍 Bon - Niveau acceptable après repas';
      remarkType = 'bon';
    } else if (level > 1.80 && level <= 2.00) {
      remark = '⚠️ Élevé - Attention à surveiller';
      remarkType = 'eleve';
    } else {
      remark = '🚨 Très élevé - Consultez votre médecin';
      remarkType = 'tres_eleve';
    }
  } else {
    // General guidelines
    if (level < 0.7) {
      remark = '⚠️ Hypoglycémie - Niveau trop bas';
      remarkType = 'tres_eleve';
    } else if (level >= 0.7 && level <= 1.20) {
      remark = '✅ Excellent - Niveau optimal';
      remarkType = 'excellent';
    } else if (level > 1.20 && level <= 1.60) {
      remark = '👍 Bon - Niveau acceptable';
      remarkType = 'bon';
    } else if (level > 1.60 && level <= 1.80) {
      remark = '⚠️ Élevé - Attention à surveiller';
      remarkType = 'eleve';
    } else {
      remark = '🚨 Très élevé - Consultez votre médecin';
      remarkType = 'tres_eleve';
    }
  }
  
  return { remark, remarkType };
};

module.exports = mongoose.model('Glucose', glucoseSchema);
