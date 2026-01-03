const express = require('express');
const router = express.Router();
const Glucose = require('../models/Glucose');
const auth = require('../middleware/auth');

// Helper function to determine glucose level remark
const getGlucoseRemark = (level) => {
  if (level < 70) {
    return 'Hypoglycémie - Très bas';
  } else if (level >= 70 && level <= 100) {
    return 'Excellent - Normal';
  } else if (level > 100 && level <= 125) {
    return 'Bon - Légèrement élevé';
  } else if (level > 125 && level <= 180) {
    return 'Attention - Élevé';
  } else {
    return 'Hyperglycémie - Très élevé';
  }
};

// Add glucose level
router.post('/', auth, async (req, res) => {
  try {
    const { level, date } = req.body;
    
    const remark = getGlucoseRemark(level);
    
    const glucose = new Glucose({
      userId: req.userId,
      level,
      date: date || new Date(),
      remark
    });

    await glucose.save();
    res.status(201).json(glucose);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l\'ajout du niveau de glucose' });
  }
});

// Get all glucose levels for user
router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, limit } = req.query;
    
    let query = { userId: req.userId };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    let glucoseQuery = Glucose.find(query).sort({ date: -1 });
    
    if (limit) {
      glucoseQuery = glucoseQuery.limit(parseInt(limit));
    }
    
    const glucoseLevels = await glucoseQuery;
    res.json(glucoseLevels);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des niveaux de glucose' });
  }
});

// Get glucose level by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const glucose = await Glucose.findOne({ _id: req.params.id, userId: req.userId });
    
    if (!glucose) {
      return res.status(404).json({ error: 'Niveau de glucose non trouvé' });
    }
    
    res.json(glucose);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération du niveau de glucose' });
  }
});

// Update glucose level
router.put('/:id', auth, async (req, res) => {
  try {
    const { level, date } = req.body;
    
    const remark = getGlucoseRemark(level);
    
    const glucose = await Glucose.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { level, date, remark },
      { new: true }
    );
    
    if (!glucose) {
      return res.status(404).json({ error: 'Niveau de glucose non trouvé' });
    }
    
    res.json(glucose);
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour du niveau de glucose' });
  }
});

// Delete glucose level
router.delete('/:id', auth, async (req, res) => {
  try {
    const glucose = await Glucose.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    
    if (!glucose) {
      return res.status(404).json({ error: 'Niveau de glucose non trouvé' });
    }
    
    res.json({ message: 'Niveau de glucose supprimé avec succès' });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la suppression du niveau de glucose' });
  }
});

// Get glucose statistics
router.get('/stats/summary', auth, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const glucoseLevels = await Glucose.find({
      userId: req.userId,
      date: { $gte: startDate }
    });
    
    if (glucoseLevels.length === 0) {
      return res.json({
        average: 0,
        min: 0,
        max: 0,
        count: 0
      });
    }
    
    const levels = glucoseLevels.map(g => g.level);
    const average = levels.reduce((a, b) => a + b, 0) / levels.length;
    const min = Math.min(...levels);
    const max = Math.max(...levels);
    
    res.json({
      average: Math.round(average * 10) / 10,
      min,
      max,
      count: glucoseLevels.length
    });
  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;
